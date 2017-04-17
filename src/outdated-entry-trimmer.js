const _ = require('lodash');
const contentful = require('./contentful');
const entryTraverser = require('./entry-traverser');
const LinkedEntryIdCollector = require('./linked-entry-id-collector');

let entries;
let fieldName;
let stats;

function getDeletableEntries() {
    const outdatedEntries = getNestedEntries(getOutdatedEntries());

    const outdatedEntriesSet = new Set(outdatedEntries);
    const explicitlyCurrentEntries = entries.filter(entry => !outdatedEntriesSet.has(entry));
    const currentEntries = new Set(getNestedEntries(explicitlyCurrentEntries));

    return outdatedEntries.filter(entry => !currentEntries.has(entry));
}

function getNestedEntries(parents) {
    let nestedEntries = parents;
    for (let linkedEntries; parents.length > 0; parents = linkedEntries) {
        const linkedEntryIds = getNestedEntryIds(parents);
        linkedEntries = entries.filter(entry => {
            return linkedEntryIds.has(entry.sys.id) && !nestedEntries.includes(entry);
        });
        nestedEntries = linkedEntries.concat(nestedEntries);
    }

    return nestedEntries;
}

async function deleteEntries(entries) {
    for (const entry of entries) {
        await deleteEntry(entry);
    }
}

async function deleteEntry(entry) {
    stats.deletedCount ++;

    await contentful.deleteEntity(entry);
}

function getOutdatedEntries() {
    return entries.filter(entry => {
        if (contentful.isInGracePeriod(entry)) {
            return false;
        }

        if (!entry.fields[fieldName]) {
            return false;
        }

        return _.every(entry.fields[fieldName], date => new Date(date) < new Date());
    });
}

function getNestedEntryIds(entries) {
    const linkedEntryIdCollector = new LinkedEntryIdCollector();
    entryTraverser.traverse(entries, linkedEntryIdCollector);

    return linkedEntryIdCollector.entryIds;
}

module.exports = {
    trim: async function(space, field) {
        fieldName = field;

        stats = {
            deletedCount: 0
        };

        entries = await contentful.getEntries(space);
        await deleteEntries(getDeletableEntries());

        return stats;
    }
}

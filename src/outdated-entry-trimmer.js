const _ = require('lodash');
const contentful = require('./contentful');
const entryTraverser = require('./entry-traverser');
const LinkedEntryIdCollector = require('./linked-entry-id-collector');

function getDeletableEntries(entries, fieldName) {
    const explicitlyOutdatedEntries = entries.filter(entry => isOutdated(entry, fieldName));
    const outdatedEntries = getNestedEntries(entries, explicitlyOutdatedEntries);

    const outdatedEntriesSet = new Set(outdatedEntries);
    const explicitlyCurrentEntries = entries.filter(entry => !outdatedEntriesSet.has(entry));
    const currentEntries = new Set(getNestedEntries(entries, explicitlyCurrentEntries));

    return outdatedEntries.filter(entry => !currentEntries.has(entry));
}

function getNestedEntries(entries, parents) {
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
        await contentful.deleteEntity(entry);
    }
}

function isOutdated(entry, fieldName) {
    if (contentful.isInGracePeriod(entry)) {
        return false;
    }

    if (!entry.fields[fieldName]) {
        return false;
    }

    return _.every(entry.fields[fieldName], date => new Date(date) < new Date());
}

function getNestedEntryIds(entries) {
    const linkedEntryIdCollector = new LinkedEntryIdCollector();
    entryTraverser.traverse(entries, linkedEntryIdCollector);

    return linkedEntryIdCollector.entryIds;
}

module.exports = {
    trim: async function(space, fieldName) {
        const entries = await contentful.getEntries(space);
        const deletableEntries = getDeletableEntries(entries, fieldName);
        await deleteEntries(deletableEntries);

        return {
            deletedCount: deletableEntries.length
        };
    }
}

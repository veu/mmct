const _ = require('lodash');
const contentful = require('./contentful');
const EntryTraverser = require('./entry-traverser');
const LinkedEntryIdCollector = require('./linked-entry-id-collector');
const promiseAll = require('sync-p/all');

module.exports = class OutdatedEntryTrimmer {
    constructor(fieldName) {
        this.fieldName = fieldName;
    }

    async trim(space) {
        this.stats = {
            deletedCount: 0
        };  

        this.entries = await contentful.getEntries(space);
        this.deleteEntries(this.getDeletableEntries());

        return this.stats;
    }

    getDeletableEntries() {
        const outdatedEntries = this.getNestedEntries(this.getOutdatedEntries());

        const outdatedEntriesSet = new Set(outdatedEntries);
        const explicitlyCurrentEntries = this.entries.filter(entry => !outdatedEntriesSet.has(entry));
        const currentEntries = new Set(this.getNestedEntries(explicitlyCurrentEntries));
        
        return outdatedEntries.filter(entry => !currentEntries.has(entry));
    }

    getNestedEntries(parents) {
        let nestedEntries = parents;
        for (let linkedEntries; parents.length > 0; parents = linkedEntries) {
            const linkedEntryIds = this.getNestedEntryIds(parents);
            linkedEntries = this.entries.filter(entry => {
                return linkedEntryIds.has(entry.sys.id) && !nestedEntries.includes(entry);
            });
            nestedEntries = nestedEntries.concat(linkedEntries);
        }

        return nestedEntries;
    }

    deleteEntries(entries) {
        return promiseAll(entries.map(entry => this.deleteEntry(entry)));
    }

    deleteEntry(entry) {
        this.stats.deletedCount ++;

        return contentful.deleteEntity(entry);
    }

    getOutdatedEntries() {
        return this.entries.filter(entry => {
            if (contentful.isInGracePeriod(entry)) {
                return false;
            }

            if (!entry.fields[this.fieldName]) {
                return false;
            }

            return _.every(entry.fields[this.fieldName], date => new Date(date) < new Date());
        });
    }

    getNestedEntryIds(entries) {
        const entryTraverser = new EntryTraverser();
        const linkedEntryIdCollector = new LinkedEntryIdCollector();
        entryTraverser.traverse(entries, linkedEntryIdCollector);

        return linkedEntryIdCollector.entryIds;
    }
}

const _ = require('lodash');
const contentful = require('./contentful');
const EntryLink = require('./entry-link');
const EntryTraverser = require('./entry-traverser');
const LinkedEntryIdCollector = require('./linked-entry-id-collector');
const promiseAll = require('sync-p/all');

module.exports = class OutdatedEntryTrimmer {
    constructor(field) {
        this.field = field;
    }

    trim(space) {
        this.stats = {
            deletedCount: 0
        };  

        return space
            .getEntries()
            .then(entries => this.entries = entries.items)
            .then(() => this.deleteEntries(this.getDeletableEntries()))
            .then(() => this.stats);
    }

    getDeletableEntries() {
        const outdatedEntries = this.getNestedEntries(this.getOutdatedEntries());
        const outdatedEntriesSet = new Set(outdatedEntries);
        const currentEntries = new Set(this.getNestedEntries(this.entries.filter(entry => !outdatedEntriesSet.has(entry))));
        
        return outdatedEntries.filter(entry => !currentEntries.has(entry));
    }

    getNestedEntries(parents) {
        let nestedEntries = parents;
        for (let linkedEntries; parents.length > 0; parents = linkedEntries) {
            const linkedEntryIds = this.getNestedEntryIds(parents);
            linkedEntries = this.entries.filter(entry => linkedEntryIds.has(entry.sys.id));
            nestedEntries = nestedEntries.concat(linkedEntries);
        }

        return nestedEntries;
    }

    deleteEntries(entries) {
        return promiseAll(entries.map(entry => this.deleteEntry(entry)));
    }

    deleteEntry(entry) {
        this.printEntryInfo(entry);
        this.stats.deletedCount ++;

        return contentful.deleteEntity(entry);
    }

    printEntryInfo(entry) {
        const link = new EntryLink(entry);
        const age = Math.floor(contentful.getAgeInDays(entry));
        console.log(`deleting ${age} day${age>1 ? 's' : ''} old entry ${link}`);
    }

    getOutdatedEntries() {
        return this.entries.filter(entry => {
            if (contentful.isInGracePeriod(entry)) {
                return false;
            }

            if (!entry.fields[this.field]) {
                return false;
            }

            return _.every(entry.fields[this.field], date => new Date(date) < new Date());
        });
    }

    getNestedEntryIds(entries) {
        const entryTraverser = new EntryTraverser();
        const linkedEntryIdCollector = new LinkedEntryIdCollector();
        entryTraverser.traverse(entries, linkedEntryIdCollector);
        return linkedEntryIdCollector.entryIds;
    }

    filterUsedEntries(deletableEntries, entries) {

    }
}
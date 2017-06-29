import {every} from 'lodash';
import * as contentful from './contentful';
import {Entry, Space} from 'contentful-management';
import {traverseEntries} from './entry-traverser';
import {createLinkedEntryIdCollector} from './linked-entry-id-collector';

export async function trimOutdatedEntries(space: Space, fieldName: string) {
    const entries = await contentful.getEntries(space);
    const deletableEntries = getDeletableEntries(entries, fieldName);
    await deleteEntries(deletableEntries);

    return {
        deletedCount: deletableEntries.length
    };
}

function getDeletableEntries(entries: Entry[], fieldName: string): Entry[] {
    const explicitlyOutdatedEntries = entries.filter(entry => isOutdated(entry, fieldName));
    const outdatedEntries = getNestedEntries(entries, explicitlyOutdatedEntries);

    const outdatedEntriesSet = new Set(outdatedEntries);
    const explicitlyCurrentEntries = entries.filter(entry => !outdatedEntriesSet.has(entry));
    const currentEntries = new Set(getNestedEntries(entries, explicitlyCurrentEntries));

    return outdatedEntries.filter(entry => !currentEntries.has(entry));
}

function getNestedEntries(entries: Entry[], parents: Entry[]): Entry[] {
    let nestedEntries = parents;
    for (let linkedEntries; parents.length > 0; parents = linkedEntries) {
        const linkedEntryIds = getNestedEntryIds(parents);
        linkedEntries = entries.filter(entry => {
            return linkedEntryIds.has(entry.sys.id) && nestedEntries.indexOf(entry) === -1;
        });
        nestedEntries = linkedEntries.concat(nestedEntries);
    }

    return nestedEntries;
}

async function deleteEntries(entries: Entry[]) {
    for (const entry of entries) {
        await contentful.deleteEntity(entry);
    }
}

function isOutdated(entry: Entry, fieldName: string) {
    if (contentful.isInGracePeriod(entry)) {
        return false;
    }

    if (!entry.fields[fieldName]) {
        return false;
    }

    return every(entry.fields[fieldName], (date: string) => new Date(date) < new Date());
}

function getNestedEntryIds(entries: Entry[]) {
    const linkedEntryIdCollector = createLinkedEntryIdCollector();
    traverseEntries(entries, linkedEntryIdCollector);

    return linkedEntryIdCollector.entryIds;
}

import {createLinkedEntryIdCollector} from './linked-entry-id-collector';
import * as contentful from './contentful';
import {Entry, Space} from 'contentful-management';
import * as entryTraverser from './entry-traverser';

export async function trimOrphanedEntries(space: Space, modelId: string) {
    const entries = await contentful.getEntries(space);
    const usedEntryIds = collectUsedEntryIds(entries);
    const relevantEntries = entries.filter(entry => entry.sys.contentType.sys.id === modelId);
    const unusedEntries = relevantEntries.filter(entry => !isInUse(entry, usedEntryIds));

    await deleteEntries(unusedEntries);

    return {
        deletedCount: unusedEntries.length
    };
}

function collectUsedEntryIds(entries: Entry[]) {
    const entryIdCollector = createLinkedEntryIdCollector();

    entryTraverser.traverseEntries(entries, entryIdCollector);

    return entryIdCollector.entryIds;
}

function isInUse(entry: Entry, usedEntryIds: Set<string>) {
    if (usedEntryIds.has(entry.sys.id)) {
        return true;
    }

    if (contentful.isInGracePeriod(entry)) {
        return true;
    }

    return false;
}

async function deleteEntries(entries: Entry[]) {
    for (const entry of entries) {
        await contentful.deleteEntity(entry);
    }
}

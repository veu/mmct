const LinkedEntryIdCollector = require('./linked-entry-id-collector');
const contentful = require('./contentful');
const entryTraverser = require('./entry-traverser');

module.exports = {
    trim: async function(space, modelId) {
        const entries = await contentful.getEntries(space);
        const usedEntryIds = collectUsedEntryIds(entries);
        const relevantEntries = entries.filter(entry => entry.sys.contentType.sys.id === modelId);
        const unusedEntries = relevantEntries.filter(entry => !isInUse(entry, usedEntryIds));

        await deleteEntries(unusedEntries);

        return {
            deletedCount: unusedEntries.length
        };
    }
}

function collectUsedEntryIds(entries) {
    const entryIdCollector = new LinkedEntryIdCollector();

    entryTraverser.traverse(entries, entryIdCollector);

    return entryIdCollector.entryIds;
}

function isInUse(entry, usedEntryIds) {
    if (usedEntryIds.has(entry.sys.id)) {
        return true;
    }

    if (contentful.isInGracePeriod(entry)) {
        return true;
    }

    return false;
}

async function deleteEntries(entries) {
    for (const entry of entries) {
        await contentful.deleteEntity(entry);
    }
}

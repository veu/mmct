const AssetIdCollector = require('./asset-id-collector');
const contentful = require('./contentful');
const entryTraverser = require('./entry-traverser');

module.exports = {
    trim: async function(space) {
        const entries = await contentful.getEntries(space);
        const deletableDrafts = getDeletableDrafts(entries);
        await deleteDrafts(deletableDrafts);

        return {
            deletedCount: deletableDrafts.length
        };
    }
}

function getDeletableDrafts(entries) {
    return entries.filter(entry => {
        if (entry.isPublished()) {
            return false;
        }

        if (contentful.isInGracePeriod(entry)) {
            return false;
        }

        return true;
    });
}

async function deleteDrafts(drafts) {
    for (const draft of drafts) {
        await contentful.deleteEntity(draft);
    }
}

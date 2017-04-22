const AssetIdCollector = require('./asset-id-collector');
const contentful = require('./contentful');
const entryTraverser = require('./entry-traverser');

function collectAssetIds(entries) {
    const assetIdCollector = new AssetIdCollector();

    entryTraverser.traverse(entries, assetIdCollector);

    return assetIdCollector.assetIds;
}

function isInUse(asset, usedAssetIds) {
    if (usedAssetIds.has(asset.sys.id)) {
        return true;
    }

    if (contentful.isInGracePeriod(asset)) {
        return true;
    }

    return false;
}

async function deleteAssets(assets) {
    for (const asset of assets) {
        await contentful.deleteEntity(asset);
    }
}

module.exports = {
    trim: async function(space) {
        const usedAssetIds = collectAssetIds(await contentful.getEntries(space));
        const assets = await contentful.getAssets(space);
        const unusedAssets = assets.filter(asset => !isInUse(asset, usedAssetIds));
        await deleteAssets(unusedAssets);

        return {
            deletedCount: unusedAssets.length
        };
    }
}

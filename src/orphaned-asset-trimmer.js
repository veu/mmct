const AssetIdCollector = require('./asset-id-collector');
const contentful = require('./contentful');
const entryTraverser = require('./entry-traverser');

let stats;

function collectAssetIds(entries) {
    const assetIdCollector = new AssetIdCollector();

    entryTraverser.traverse(entries, assetIdCollector);

    return assetIdCollector.assetIds;
}

async function deleteUnusedAssets(assets, usedAssetIds) {
    const unusedAssets = assets.filter(asset => !isInUse(asset, usedAssetIds));

    for (const asset of unusedAssets) {
        await deleteAsset(asset);
    }
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

async function deleteAsset(asset) {
    stats.deletedCount ++;

    await contentful.deleteEntity(asset);
}

module.exports = {
    trim: async function(space) {
        stats = {
            deletedCount: 0
        };

        const usedAssetIds = collectAssetIds(await contentful.getEntries(space));
        await deleteUnusedAssets(await contentful.getAssets(space), usedAssetIds);

        return stats;
    }
}

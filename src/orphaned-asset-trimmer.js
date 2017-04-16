const AssetIdCollector = require('./asset-id-collector');
const contentful = require('./contentful');
const EntryTraverser = require('./entry-traverser');

module.exports = class OrphanedAssetTrimmer {
    async trim(space) {
        this.stats = {
            deletedCount: 0
        };

        this.collectAssetIds(await contentful.getEntries(space));
        await this.deleteUnusedAssets(await contentful.getAssets(space));

        return this.stats;
    }

    collectAssetIds(entries) {
        const entryTraverser = new EntryTraverser();
        const assetIdCollector = new AssetIdCollector();

        entryTraverser.traverse(entries, assetIdCollector);
        
        this.usedAssetIds = assetIdCollector.assetIds;
    }

    async deleteUnusedAssets(assets) {
        const unusedAssets = assets.filter(asset => !this.isInUse(asset));

        for (const asset of unusedAssets) {
            await this.deleteAsset(asset);
        }
    }

    isInUse(asset) {
        if (this.usedAssetIds.has(asset.sys.id)) {
            return true;
        }

        if (contentful.isInGracePeriod(asset)) {
            return true;
        }
        
        return false;
    }

    async deleteAsset(asset) {
        this.stats.deletedCount ++;

        await contentful.deleteEntity(asset);
    }
}

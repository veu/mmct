const AssetIdCollector = require('./asset-id-collector');
const AssetLink = require('./asset-link');
const EntryTraverser = require('./entry-traverser');
const promiseAll = require('sync-p/all');

module.exports = class AssetTrimmer {

    trim(space, gracePeriod, isDryRun) {
        this.gracePeriod = gracePeriod;
        this.isDryRun = isDryRun;

        this.stats = {
            deletedCount: 0
        };

        return space
            .getEntries()
            .then(entries => this.collectAssetIds(entries))
            .then(() => space.getAssets())
            .then(assets => this.deleteUnusedAssets(assets))
            .then(() => this.stats);
    }

    collectAssetIds(entries) {
        const entryTraverser = new EntryTraverser();
        const assetIdCollector = new AssetIdCollector();
        entryTraverser.traverse(entries, assetIdCollector);
        
        this.usedAssetIds = assetIdCollector.assetIds;
    }

    deleteUnusedAssets(assets) {
        const unusedAssets = assets.items.filter(asset => !this.isInUse(asset));
        return promiseAll(unusedAssets.map(asset => this.deleteAsset(asset)));
    }

    isInUse(asset) {
        if (this.usedAssetIds.has(asset.sys.id)) {
            return true;
        }

        if (this.getAgeInDays(asset) <= this.gracePeriod) {
            return true;
        }
        
        return false;
    }

    printAssetInfo(asset) {
        const link = new AssetLink(asset);
        const age = Math.floor(this.getAgeInDays(asset));
        console.log(`deleting ${age} day${age>1 ? 's' : ''} old asset ${link}`);
    }

    getAgeInDays(asset) {
        const now = new Date();
        const updatedAt = new Date(asset.sys.updatedAt);
        const diff = now - updatedAt;
        return diff / (24 * 60 * 60 * 1000);
    }

    deleteAsset(asset) {
        this.printAssetInfo(asset);
        this.stats.deletedCount ++;

        if (this.isDryRun) {
            return;
        }

        if (asset.isPublished()) {
            return asset.unpublish().then(() => asset.delete());
        }

        return asset.delete();
    }
}
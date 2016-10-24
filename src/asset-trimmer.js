const AssetIdCollector = require('./asset-id-collector');
const AssetLink = require('./asset-link');
const EntryTraverser = require('./entry-traverser');

module.exports = class AssetTrimmer {

    trim(space, gracePeriod, isDryRun) {
        this.gracePeriod = gracePeriod;
        this.isDryRun = isDryRun;

        this.stats = {
            deletedCount: 0
        };

        const promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });

        space
            .getEntries()
            .then(entries => this.collectAssetIds(entries))
            .then(() => space.getAssets())
            .then(assets => this.handleAssets(assets))
            .catch(error => this.reject(error));

        return promise;
    }

    collectAssetIds(entries) {
        const entryTraverser = new EntryTraverser();
        const assetIdCollector = new AssetIdCollector();
        entryTraverser.traverse(entries, assetIdCollector);
        
        this.usedAssetIds = assetIdCollector.assetIds;
    }

    handleAssets(assets) {
        const unusedAssets = assets.items.filter(asset => !this.isUsed(asset));

        if (this.isDryRun || unusedAssets.length == 0) {
            unusedAssets.forEach(asset => this.printAssetInfo(asset));
            this.resolve(this.stats);
            return;
        }

        this.deleteAssets(unusedAssets);
    }

    isUsed(asset) {
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

    deleteAssets(assets) {
        if (assets.length == 0) {
            this.resolve(this.stats);
            return;
        }

        const asset = assets.pop();
        this.printAssetInfo(asset);

        if (asset.isPublished()) {
            asset.unpublish()
                .then(() => {
                    this.deleteAsset(asset, () => this.deleteAssets(assets));
                })
                .catch(error => {
                    this.reject(error);
                });
            return;
        }

        this.deleteAsset(asset, () => this.deleteAssets(assets));
    }

    deleteAsset(asset, callback) {
        asset.delete()
            .then(() => {
                this.stats.deletedCount ++;
                callback();
            })
            .catch(error => {
                this.reject(error);
            });
    }
}
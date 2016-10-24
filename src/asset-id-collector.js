module.exports = class AssetIdCollector {
    constructor() {
        this.assetIds = new Set();
    }

    visitLink(link) {
        if (link.sys.linkType === 'Asset') {
            this.assetIds.add(link.sys.id);
        }
    }
}
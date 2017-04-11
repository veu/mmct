module.exports = class AssetIdCollector {
    constructor() {
        this.assetIds = new Set();
    }

    visitLink(link) {
        if (link.linkType === 'Asset') {
            this.assetIds.add(link.id);
        }
    }
}
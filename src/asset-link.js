module.exports = class AssetLink {
    constructor(asset) {
        this.link = `https://app.contentful.com/spaces/${asset.sys.space.sys.id}/assets/${asset.sys.id}`; 
    }

    toString() {
        return this.link;
    }
}
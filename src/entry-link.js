module.exports = class EntryLink {
    constructor(entry) {
        this.link = `https://app.contentful.com/spaces/${entry.sys.space.sys.id}/entries/${entry.sys.id}`; 
    }

    toString() {
        return this.link;
    }
}
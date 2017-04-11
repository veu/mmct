module.exports = class EntityLink {
    constructor(entity) {
        this.link = `https://app.contentful.com/spaces/${entity.sys.space.sys.id}/${entity.sys.type.toLowerCase()}s/${entity.sys.id}`; 
    }

    toString() {
        return this.link;
    }
}
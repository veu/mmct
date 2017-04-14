const pathForEntity = {
    'Asset': 'assets',
    'Entry': 'entries'
};

module.exports = class EntityLink {
    constructor(entity) {
        this.link = `https://app.contentful.com/spaces/${entity.sys.space.sys.id}/${pathForEntity[entity.sys.type]}/${entity.sys.id}`; 
    }

    toString() {
        return this.link;
    }
}
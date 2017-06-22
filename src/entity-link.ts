import {Asset, Entry} from 'contentful-management';

const pathForEntity = {
    'Asset': 'assets',
    'Entry': 'entries'
};

export default class EntityLink {
    private link: string;

    constructor(entity: Entry | Asset) {
        this.link = `https://app.contentful.com/spaces/${entity.sys.space.sys.id}/${pathForEntity[entity.sys.type]}/${entity.sys.id}`;
    }

    toString() {
        return this.link;
    }
}

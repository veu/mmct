import {Entity} from 'contentful-management';

const pathForEntity: {[key: string]: string} = {
    'Asset': 'assets',
    'Entry': 'entries',
    'WebhookDefinition': 'settings/webhooks'
};

export default class EntityLink {
    private link: string;

    constructor(entity: Entity) {
        this.link = `https://app.contentful.com/spaces/${entity.sys.space.sys.id}/${pathForEntity[entity.sys.type]}/${entity.sys.id}`;
    }

    toString() {
        return this.link;
    }
}

import {cloneDeep} from 'lodash';
import {Entry, EntryData, Field, Link} from 'contentful-management';

const user: Link<'User'> = {
    sys: {
        type: 'Link',
        linkType: 'User',
        id: 'user123'
    }
};

const basicEntry: EntryData = {
    sys: {
        space: {
            sys: {
                type: 'Link',
                linkType: 'Space',
                id: 'space123'
            }
        },
        id: 'entry123',
        type: 'Entry',
        createdAt: '2016-11-20T20:15:52.086Z',
        updatedAt: '2016-12-14T22:26:44.923Z',
        createdBy: user,
        updatedBy: user,
        publishedCounter: 3,
        version: 14,
        publishedBy: user,
        publishedVersion: 13,
        firstPublishedAt: '2016-11-20T20:16:18.590Z',
        publishedAt: '2016-12-14T22:26:44.894Z',
        contentType: {
            sys: {
                type: 'Link',
                linkType: 'ContentType',
                id: '<id>'
            }
        }
    },
    fields: {}
};

class MockEntryBuilder {
    private entry: EntryData;
    private language: string;

    constructor(contentTypeId: string) {
        this.entry = cloneDeep(basicEntry);
        this.entry.sys.contentType.sys.id = contentTypeId;

        this.language = 'en';
    }

    withId(id: string) {
        this.entry.sys.id = id;

        return this;
    }

    withField(name: string, value: Field) {
        if (!this.entry.fields[name]) {
            this.entry.fields[name] = {};
        }
        this.entry.fields[name][this.language] = value;

        return this;
    }

    withLink(name: string, linkType: string, id: string) {
        return this.withField(name, {sys: {type: 'Link', linkType, id}});
    }

    get(): Entry {
        return (<Entry>this.entry);
    }
}

export function buildMockEntry(contentTypeId = 'model-id') {
    return new MockEntryBuilder(contentTypeId);
}

const _ = require('lodash');
import {ContentType, ContentTypeData, Link} from 'contentful-management';


const user: Link<'User'> = {
    sys: {
        type: 'Link',
        linkType: 'User',
        id: 'user123'
    }
};

const basicContentType: ContentTypeData = {
    name: 'ContentType123',
    fields: [
        {
            id: 'name',
            name: 'Name',
            type: 'Symbol',
            localized: false,
            required: true,
            validations: [],
            disabled: false,
            omitted: false
        }
    ],
    displayField: 'name',
    sys: {
        id: '<id>',
        type: 'ContentType',
        createdAt: '2016-10-22T07:56:02.335Z',
        createdBy: user,
        space: {
            sys: {
                type: 'Link',
                linkType: 'Space',
                id: 'space123'
            }
        },
        firstPublishedAt: '2016-10-22T07:56:02.745Z',
        publishedCounter: 14,
        publishedAt: '2017-04-15T12:51:14.057Z',
        publishedBy: user,
        publishedVersion: 27,
        version: 28,
        updatedAt: '2017-04-15T12:51:14.076Z',
        updatedBy: user
    }
};

class MockContentTypeBuilder {
    private contentType: ContentTypeData;
    private language: string;

    constructor(contentTypeId: string) {
        this.contentType = _.cloneDeep(basicContentType);
        this.contentType.sys.id = contentTypeId;

        this.language = 'en-US';
    }

    withField(id: string, type: string) {
        this.contentType.fields.push({
            "id": id,
            "name": "Field Name",
            "type": type,
            "localized": false,
            "required": false,
            "validations": [],
            "disabled": false,
            "omitted": false
        });

        return this;
    }

    get(): ContentType {
        return this.contentType;
    }
}

export function buildMockContentType(contentTypeId: string) {
    return new MockContentTypeBuilder(contentTypeId);
}

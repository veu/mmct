const _ = require('lodash');

const user = {
    sys: {
        type: 'Link',
        linkType: 'User',
        id: 'user123'
    }
};

const basicEntry = {
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
    constructor(contentTypeId) {
        this.entry = _.cloneDeep(basicEntry);
        this.entry.sys.contentType.sys.id = contentTypeId;

        this.language = 'en-US';
    }

    withId(id) {
        this.entry.sys.id = id;

        return this;
    }

    withField(name, value) {
        if (!this.entry.fields[name]) {
            this.entry.fields[name] = {};
        }
        this.entry.fields[name][this.language] = value;

        return this;
    }

    withLink(name, linkType, id) {
        return this.withField(name, {sys: {type: 'Link', linkType, id}});
    }

    get() {
        return this.entry;
    }
}

module.exports = {
    create: function (contentTypeId) {
        return new MockEntryBuilder(contentTypeId);
    }
}

const _ = require('lodash');

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
        createdBy: {
            sys: {
                type: 'Link',
                linkType: 'User',
                id: 'user123'
            }
        },
        updatedBy: {
            sys: {
                type: 'Link',
                linkType: 'User',
                id: 'user123'
            }
        },
        publishedCounter: 3,
        version: 14,
        publishedBy: {
            sys: {
                type: 'Link',
                linkType: 'User',
                id: 'user123'
            }
        },
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
    constructor(id) {
        this.entry = _.cloneDeep(basicEntry);
        this.entry.sys.contentType.sys.id = id;

        this.language = 'en-US';
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
    create: function (id) {
        return new MockEntryBuilder(id);
    }
}
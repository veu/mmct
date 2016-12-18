const _ = require('lodash');

module.exports = class LinkedEntryIdCollector {
    constructor(field) {
        this.field = field;
        this.entryIds = new Set();
    }

    visitLink(link) {
        if (link.linkType === 'Entry') {
            this.entryIds.add(link.id);
        }
    }
}
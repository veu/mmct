const _ = require('lodash');

module.exports = class EntryTraverser {
    traverse(entries, visitor) {
        this.visitor = visitor;
        entries.items.forEach(entry => this.traverseEntry(entry));
    }

    traverseEntry(entry) {
        this.visit('Entry', entry);
        _.forOwn(entry.fields, field => this.traverseField(field));
    }

    traverseField(field) {
        if (['boolean', 'number', 'string'].includes(typeof field)) {
            this.visit(_.upperFirst(typeof field), field);
            return;
        }

        if (Array.isArray(field)) {
            this.visit('Array', field);
            return;
        }

        if (field.sys && field.sys.type === 'Link') {
            this.visit('Link', field);
            return;
        }
        
        for (const language of Object.keys(field)) {
            this.visit('Language', language);
            this.traverseField(field[language]);
        }
    }

    visit(elementName, element) {
        if (this.visitor['visit' + elementName]) {
            this.visitor['visit' + elementName](element);
        }
    }
}
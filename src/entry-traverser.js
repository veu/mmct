const _ = require('lodash');

module.exports = class EntryTraverser {
    traverse(entries, visitor) {
        this.visitor = visitor;
        entries.forEach(entry => this._traverseEntry(entry));
    }

    _traverseEntry(entry) {
        this._visit('Entry', entry);
        _.forOwn(entry.fields, (field, identifier) => this._traverseField(field, identifier));
    }

    _traverseField(field, identifier) {
        if (['boolean', 'number', 'string'].includes(typeof field)) {
            this._visit(_.upperFirst(typeof field), field, identifier);
            return;
        }

        if (Array.isArray(field)) {
            this._visit('Array', field, identifier);
            field.forEach(child => this._traverseField(child, identifier));
            return;
        }

        if (field.sys && field.sys.type === 'Link') {
            this._visit('Link', field.sys, identifier);
            return;
        }

        for (const language of Object.keys(field)) {
            this._visit('Language', field[language], language);
            this._traverseField(field[language], identifier);
        }
    }

    _visit(elementName, element, identifier) {
        if (this.visitor['visit' + elementName]) {
            this.visitor['visit' + elementName](element, identifier);
        }
    }
}
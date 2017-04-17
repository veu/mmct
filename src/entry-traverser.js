const _ = require('lodash');

let visitor;

function traverseEntry(entry) {
    visit('Entry', entry);
    _.forOwn(entry.fields, (field, identifier) => traverseField(field, identifier));
}

function traverseField(field, identifier) {
    if (['boolean', 'number', 'string'].includes(typeof field)) {
        visit(_.upperFirst(typeof field), field, identifier);
        return;
    }

    if (Array.isArray(field)) {
        visit('Array', field, identifier);
        field.forEach(child => traverseField(child, identifier));
        return;
    }

    if (field.sys && field.sys.type === 'Link') {
        visit('Link', field.sys, identifier);
        return;
    }

    for (const language of Object.keys(field)) {
        visit('Language', field[language], language);
        traverseField(field[language], identifier);
    }
}

function visit(elementName, element, identifier) {
    if (visitor['visit' + elementName]) {
        visitor['visit' + elementName](element, identifier);
    }
}

module.exports = {
    traverse: function (entries, entryVisitor) {
        visitor = entryVisitor;
        entries.forEach(entry => traverseEntry(entry));
    }
};

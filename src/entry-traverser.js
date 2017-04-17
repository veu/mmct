const _ = require('lodash');

function traverseEntry(visitor, entry) {
    visit(visitor, 'Entry', entry);
    _.forOwn(entry.fields, (field, identifier) => traverseField(visitor, field, identifier));
}

function traverseField(visitor, field, identifier) {
    if (['boolean', 'number', 'string'].includes(typeof field)) {
        visit(visitor, _.upperFirst(typeof field), field, identifier);
        return;
    }

    if (Array.isArray(field)) {
        visit(visitor, 'Array', field, identifier);
        field.forEach(child => traverseField(visitor, child, identifier));
        return;
    }

    if (field.sys && field.sys.type === 'Link') {
        visit(visitor, 'Link', field.sys, identifier);
        return;
    }

    for (const language of Object.keys(field)) {
        visit(visitor, 'Language', field[language], language);
        traverseField(visitor, field[language], identifier);
    }
}

function visit(visitor, elementName, element, identifier) {
    if (visitor['visit' + elementName]) {
        visitor['visit' + elementName](element, identifier);
    }
}

module.exports = {
    traverse: function (entries, visitor) {
        entries.forEach(entry => traverseEntry(visitor, entry));
    }
};

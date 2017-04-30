const _ = require('lodash');
const contentful = require('../src/contentful');
const EntityLink = require('./entity-link');
const inquirer = require('inquirer');

module.exports = {
    test: async function(space, modelId, fieldName) {
        const regex = await getRegex();
        const entries = await contentful.getEntries(space, {content_type: modelId});
        const matchingEntries = getMatchingEntries(entries, fieldName, regex);

        return {
            matchedCount: matchingEntries.length,
            testedCount: entries.length
        };
    }
}

async function getRegex() {
    const {regex, flags} = await inquirer.prompt([
        {
            name: 'regex',
            message: 'Please enter the regex without delimiters:'
        },
        {
            name: 'flags',
            message: 'Please enter the flags:'
        }
    ]);

    return new RegExp(regex, flags);
}

function getMatchingEntries(entries, fieldName, regex) {
    return entries.filter(entry => {
        return testEntry(entry, fieldName, regex);
    });
}

function testEntry(entry, fieldName, regex) {
    if (!entry.fields[fieldName]) {
        const link = new EntityLink(entry);
        console.log(`Field ‘${fieldName}’ is missing in entry ${link}`);

        return false;
    }

    let matched = true;

    _.each(entry.fields[fieldName], (value, locale) => {
        if (typeof value !== 'string') {
            throw new Error(`Field ‘${fieldName}’ is not a text field`);
        }

        regex.lastIndex = 0;
        if (!regex.test(value)) {
            const link = new EntityLink(entry);
            console.log(`Locale ‘${locale}’ doesn’t match in entry ${link}`);
            matched = false;
        }
    });

    return matched;
}

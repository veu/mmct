import {forOwn} from 'lodash';
import * as contentful from '../src/contentful';
import {Entry, Space} from 'contentful-management';
import EntityLink from './entity-link';
import * as inquirer from 'inquirer';
import {info} from './logger';

export async function testRegex(space: Space, modelId: string, fieldName: string) {
    const regex = await getRegex();
    const entries = await contentful.getEntries(space, {content_type: modelId});
    const matchingEntries = getMatchingEntries(entries, fieldName, regex);

    return {
        matchedCount: matchingEntries.length,
        testedCount: entries.length
    };
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

function getMatchingEntries(entries: Entry[], fieldName: string, regex: RegExp) {
    return entries.filter(entry => {
        return testEntry(entry, fieldName, regex);
    });
}

function testEntry(entry: Entry, fieldName: string, regex: RegExp) {
    if (!entry.fields[fieldName]) {
        const link = new EntityLink(entry);
        info(`Field ‘${fieldName}’ is missing in entry ${link}`);

        return false;
    }

    let matched = true;

    forOwn(entry.fields[fieldName], (value, locale) => {
        if (typeof value !== 'string') {
            throw new Error(`Field ‘${fieldName}’ is not a text field`);
        }

        regex.lastIndex = 0;
        if (!regex.test(value)) {
            const link = new EntityLink(entry);
            info(`Locale ‘${locale}’ doesn’t match in entry ${link}`);
            matched = false;
        }
    });

    return matched;
}

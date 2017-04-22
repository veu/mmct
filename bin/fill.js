#!/usr/bin/env node

const config = require('../src/config');
const contentful = require('../src/contentful');
const entryWriter = require('../src/entry-writer');
const yargs = require('yargs');

const reportError = (error) => {
    try {
        error = JSON.parse(error.message);
    } catch (ignore) {}

    console.error('Error: ' + error.message);
};

yargs
    .version()
    .usage('$0 <cmd> [args] [options]')
    .command('default-value <space> <content-model-id> <field> <value>', 'enter a default value where missing', {}, async function (argv) {
        try {
            const token = await config.getToken();
            const space = await contentful.getSpace(argv.space, token);
            const stats = await entryWriter.fillDefaultValue(space, argv.contentModelId, argv.field, argv.value);

            console.log(`Updated ${stats.updatedCount} entries.`);
        } catch (e) {
            reportError(e);
        }
    })
    .demandCommand(1, 'Please provide a valid command.')
    .help()
    .argv

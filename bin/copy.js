#!/usr/bin/env node

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
    .command('value <space> <token> <content-model-id> <src-field> <dest-field>', 'copy field values to another field', {}, async function (argv) {
        try {
            const space = await contentful.getSpace(argv.space, argv.token);
            const stats = await entryWriter.copyValue(space, argv.contentModelId, argv.srcField, argv.destField);

            console.log(`Updated ${stats.updatedCount} entries.`);
        } catch (e) {
            reportError(e);
        }
    })
    .demandCommand(1, 'Please provide a valid command.')
    .help()
    .argv

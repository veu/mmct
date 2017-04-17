#!/usr/bin/env node

const contentful = require('../src/contentful');
const entryWriter = require('../src/entry-writer');
const getStdin = require('get-stdin');
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
    .command('default-value <space> <token> <content-model-id> <field>', 'enter a default value where missing', {}, async function (argv) {
        try {
            console.log('Reading from stdin…');
            const value = await getStdin();

            const space = await contentful.getSpace(argv.space, argv.token);
            const stats = await entryWriter.fillDefaultValue(space, argv.contentModelId, argv.field, value);

            console.log(`Updated ${stats.updatedCount} entries.`);
        } catch (e) {
            reportError(e);
        }
    })
    .demandCommand(1, 'Please provide a valid command.')
    .help()
    .argv

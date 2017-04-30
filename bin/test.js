#!/usr/bin/env node

const config = require('../src/config');
const contentful = require('../src/contentful');
const regexTester = require('../src/regex-tester');
const yargs = require('yargs');

const reportError = (error) => {
    try {
        error = JSON.parse(error.message);
    } catch (ignore) {}

    console.error('Error: ' + error.message);
};

async function test() {
    yargs
        .version()
        .usage('$0 <cmd> [args] [options]')
        .command('regex <space> <content-model-id> <field>', 'test regex against existing entries', {}, async function (argv) {
            try {
                const token = await config.getToken();
                const space = await contentful.getSpace(argv.space, token);
                const stats = await regexTester.test(space, argv.contentModelId, argv.field);

                console.log(`${stats.matchedCount} of ${stats.testedCount} entries matched.`);
            } catch (e) {
                reportError(e);
            }
        })
        .demandCommand(1, 'Please provide a valid command.')
        .help()
        .argv
}

test();

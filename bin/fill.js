#!/usr/bin/env node

const commands = require('../src/commands');
const yargs = require('yargs');

yargs
    .version()
    .usage('$0 <cmd> [args] [options]')
    .command('default-value <space> <token> <content-model-id> <field>', 'enter a default value where missing', {}, async function (argv) {
        await commands.fillDefaultValue(argv.space, argv.token, argv.contentModelId, argv.field);
    })
    .demandCommand(1, 'Please provide a valid command.')
    .help()
    .argv
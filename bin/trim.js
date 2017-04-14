#!/usr/bin/env node

const commands = require('../src/commands');
const yargs = require('yargs');

yargs
    .version()
    .usage('$0 <cmd> [args] [options]')
    .option('dry-run', {
        describe: 'just print, don’t delete anything',
        type: 'boolean',
        default: false
    })
    .option('grace-period', {
        describe: 'keep anything younger than number of days',
        type: 'number',
        nargs: 1,
        default: 5
    })
    .command('orphaned-assets <space> <token>', 'delete unused assets', {}, async function (argv) {
        await commands.trimOrphanedAssets(argv.space, argv.token, argv.gracePeriod, argv.dryRun);
    })
    .command('outdated-entries <space> <token> <field>', 'delete entries where <field> is in the past', {}, async function (argv) {
        await commands.trimOutdatedEntries(argv.space, argv.token, argv.field, argv.gracePeriod, argv.dryRun);
    })
    .demandCommand(1, 'Please provide a valid command.')
    .help()
    .argv
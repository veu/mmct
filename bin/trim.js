#!/usr/bin/env node

const contentful = require('../src/contentful');
const orphanedAssetTrimmer = require('../src/orphaned-asset-trimmer');
const orphanedEntryTrimmer = require('../src/orphaned-entry-trimmer');
const outdatedEntryTrimmer = require('../src/outdated-entry-trimmer');
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
        contentful.config.gracePeriod = argv.gracePeriod;
        contentful.config.isDryRun = argv.dryRun;

        try {
            const space = await contentful.getSpace(argv.space, argv.token);
            const stats = await orphanedAssetTrimmer.trim(space);

            console.log(`Deleted ${stats.deletedCount} orphaned assets.`);
        } catch (e) {
            reportError(e);
        }
    })
    .command('orphaned-entries <space> <token> <content-model-id>', 'delete unused entries of the type', {}, async function (argv) {
        contentful.config.gracePeriod = argv.gracePeriod;
        contentful.config.isDryRun = argv.dryRun;

        try {
            const space = await contentful.getSpace(argv.space, argv.token);
            const stats = await orphanedEntryTrimmer.trim(space, argv.contentModelId);

            console.log(`Deleted ${stats.deletedCount} orphaned entries.`);
        } catch (e) {
            reportError(e);
        }
    })
    .command('outdated-entries <space> <token> <field>', 'delete entries where <field> is in the past', {}, async function (argv) {
        contentful.config.gracePeriod = argv.gracePeriod;
        contentful.config.isDryRun = argv.dryRun;

        try {
            const space = await contentful.getSpace(argv.space, argv.token);
            const stats = await outdatedEntryTrimmer.trim(space, argv.field);

            console.log(`Deleted ${stats.deletedCount} outdated entries.`);
        } catch (e) {
            reportError(e);
        }
    })
    .demandCommand(1, 'Please provide a valid command.')
    .help()
    .argv

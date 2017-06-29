import {getGracePeriod, getToken} from '../config';
import {config, getSpace} from '../contentful';
import {trimDrafts} from '../draft-trimmer';
import {error, info} from '../logger';
import {trimOrphanedAssets} from '../orphaned-asset-trimmer';
import {trimOrphanedEntries} from '../orphaned-entry-trimmer';
import {trimOutdatedEntries} from '../outdated-entry-trimmer';
import {Argv} from 'yargs';

export async function addCommands(program: Argv) {
    program
        .option('dry-run', {
            describe: 'just print, don’t delete anything',
            type: 'boolean',
            default: false
        })
        .option('grace-period', {
            describe: 'keep anything younger than number of days',
            type: 'number',
            nargs: 1,
            default: await getGracePeriod()
        })
        .command('trim-drafts <space>', 'delete drafts', {}, async function (argv: any) {
            config.gracePeriod = argv.gracePeriod;
            config.isDryRun = argv.dryRun;

            try {
                const token = await getToken();
                const space = await getSpace(argv.space, token);
                const stats = await trimDrafts(space);

                info(`Deleted ${stats.deletedCount} drafts.`);
            } catch (exception) {
                error(exception.message, exception);
            }
        })
        .command('trim-orphaned-assets <space>', 'delete unused assets', {}, async function (argv: any) {
            config.gracePeriod = argv.gracePeriod;
            config.isDryRun = argv.dryRun;

            try {
                const token = await getToken();
                const space = await getSpace(argv.space, token);
                const stats = await trimOrphanedAssets(space);

                info(`Deleted ${stats.deletedCount} orphaned assets.`);
            } catch (exception) {
                error(exception.message, exception);
            }
        })
        .command('trim-orphaned-entries <space> <content-model-id>', 'delete unused entries of the type', {}, async function (argv: any) {
            config.gracePeriod = argv.gracePeriod;
            config.isDryRun = argv.dryRun;

            try {
                const token = await getToken();
                const space = await getSpace(argv.space, token);
                const stats = await trimOrphanedEntries(space, argv.contentModelId);

                info(`Deleted ${stats.deletedCount} orphaned entries.`);
            } catch (exception) {
                error(exception.message, exception);
            }
        })
        .command('trim-outdated-entries <space> <field>', 'delete entries where <field> is in the past', {}, async function (argv: any) {
            config.gracePeriod = argv.gracePeriod;
            config.isDryRun = argv.dryRun;

            try {
                const token = await getToken();
                const space = await getSpace(argv.space, token);
                const stats = await trimOutdatedEntries(space, argv.field);

                info(`Deleted ${stats.deletedCount} outdated entries.`);
            } catch (exception) {
                error(exception.message, exception);
            }
        });
}

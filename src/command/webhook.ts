import {getToken} from '../config';
import {config, getSpace} from '../contentful';
import {error, info} from '../logger';
import {Argv} from 'yargs';
import {markAllWebhooks, unmarkAllWebhooks} from '../webhook-writer';

export async function addCommands(program: Argv) {
    program
        .command('webhook-mark-all <space> <name> <value>', 'mark all webhooks', {}, async function (argv: any) {
            config.isDryRun = argv.dryRun;

            try {
                const token = await getToken();
                const space = await getSpace(argv.space, token);
                const stats = await markAllWebhooks(space, argv.name, argv.value);

                info(`Marked ${stats.markedCount} of ${stats.totalCount} webhooks.`);
            } catch (exception) {
                error(exception.message, exception);
            }
        })
        .command('webhook-unmark-all <space> <name> <value>', 'unmark all webhooks', {}, async function (argv: any) {
            try {
                const token = await getToken();
                const space = await getSpace(argv.space, token);
                const stats = await unmarkAllWebhooks(space, argv.name, argv.value);

                info(`Marked ${stats.unmarkedCount} of ${stats.totalCount} webhooks.`);
            } catch (exception) {
                error(exception.message, exception);
            }
        });
}

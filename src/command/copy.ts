import {getToken} from '../config';
import {getSpace} from '../contentful';
import {copyValue} from '../entry-writer';
import {error, info} from '../logger';
import {Argv} from 'yargs';

export async function addCommands(program: Argv) {
    program
        .command('copy-value <space> <content-model-id> <src-field> <dest-field>', 'copy field values to another field', {}, async function (argv: any) {
            try {
                const token = await getToken();
                const space = await getSpace(argv.space, token);
                const stats = await copyValue(space, argv.contentModelId, argv.srcField, argv.destField);

                info(`Updated ${stats.updatedCount} entries.`);
            } catch (exception) {
                error(exception.message, exception);
            }
        });
}

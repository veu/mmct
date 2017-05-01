import {getToken} from '../config';
import {getSpace} from '../contentful';
import {copyValue} from '../entry-writer';
import {Argv} from 'yargs';

const reportError = (error: Error) => {
    try {
        error = JSON.parse(error.message);
    } catch (ignore) {}

    console.error('Error: ' + error.message);
};

export async function addCommands(program: Argv) {
    program
        .command('copy-value <space> <content-model-id> <src-field> <dest-field>', 'copy field values to another field', {}, async function (argv: any) {
            try {
                const token = await getToken();
                const space = await getSpace(argv.space, token);
                const stats = await copyValue(space, argv.contentModelId, argv.srcField, argv.destField);

                console.log(`Updated ${stats.updatedCount} entries.`);
            } catch (e) {
                reportError(e);
            }
        });
}

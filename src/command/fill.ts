import {getToken} from '../config';
import {getSpace} from '../contentful';
import {fillDefaultValue} from '../entry-writer';
import {Argv} from 'yargs';

const reportError = (error: Error) => {
    try {
        error = JSON.parse(error.message);
    } catch (ignore) {}

    console.error('Error: ' + error.message);
};

export async function addCommands(program: Argv) {
    program
        .command('fill-default-value <space> <content-model-id> <field> <value>', 'enter a default value where missing', {}, async function (argv: any) {
            try {
                const token = await getToken();
                const space = await getSpace(argv.space, token);
                const stats = await fillDefaultValue(space, argv.contentModelId, argv.field, argv.value);

                console.log(`Updated ${stats.updatedCount} entries.`);
            } catch (e) {
                reportError(e);
            }
        });
}

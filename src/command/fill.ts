import {getToken} from '../config';
import {getSpace} from '../contentful';
import {fillDefaultValue} from '../entry-writer';
import {error, info} from '../logger';
import {Argv} from 'yargs';

export async function addCommands(program: Argv) {
    program
        .command('fill-default-value <space> <content-model-id> <field> <value>', 'enter a default value where missing', {}, async function (argv: any) {
            try {
                const token = await getToken();
                const space = await getSpace(argv.space, token);
                const stats = await fillDefaultValue(space, argv.contentModelId, argv.field, argv.value);

                info(`Updated ${stats.updatedCount} entries.`);
            } catch (exception) {
                error(exception.message, exception);
            }
        });
}

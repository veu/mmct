import {getToken} from '../config';
import {getSpace} from '../contentful';
import {error, info} from '../logger';
import {testRegex} from '../regex-tester';
import {Argv} from 'yargs';

export async function addCommands(program: Argv) {
    program
        .command('test-regex <space> <content-model-id> <field>', 'test regex against existing entries', {}, async function (argv: any) {
            try {
                const token = await getToken();
                const space = await getSpace(argv.space, token);

                const stats = await testRegex(space, argv.contentModelId, argv.field);

                info(`${stats.matchedCount} of ${stats.testedCount} entries matched.`);
            } catch (exception) {
                error(exception.message, exception);
            }
        });
}

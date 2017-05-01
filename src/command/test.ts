import {getToken} from '../config';
import {getSpace} from '../contentful';
import {testRegex} from '../regex-tester';
import {Argv} from 'yargs';

const reportError = (error: Error) => {
    try {
        error = JSON.parse(error.message);
    } catch (ignore) {}

    console.error('Error: ' + error.message);
};

export async function addCommands(program: Argv) {
    program
        .command('test-regex <space> <content-model-id> <field>', 'test regex against existing entries', {}, async function (argv: any) {
            try {
                const token = await getToken();
                const space = await getSpace(argv.space, token);

                const stats = await testRegex(space, argv.contentModelId, argv.field);


                console.log(`${stats.matchedCount} of ${stats.testedCount} entries matched.`);
            } catch (e) {
                reportError(e);
            }
        });
}

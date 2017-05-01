import {getGracePeriod, getToken} from '../config';
import {Argv} from 'yargs';

export async function addCommands(program: Argv) {
    program
        .command('init-config', 'initialize config', {}, async function (argv: any) {
            await getToken();
            await getGracePeriod();
        });
}

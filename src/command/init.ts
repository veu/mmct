import {getGracePeriod, getGraylogSettings, getToken} from '../config';
import {error} from '../logger';
import {Argv} from 'yargs';

export async function addCommands(program: Argv) {
    program
        .command('init-config', 'initialize config', {}, async function (argv: any) {
            try {
                await getToken();
                await getGracePeriod();
                await getGraylogSettings();
            } catch (exception) {
                error(exception.message, exception);
            }
        });
}

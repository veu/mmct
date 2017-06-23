import * as Configstore from 'configstore';
import * as inquirer from 'inquirer';

const pkg = require('../package.json');

const conf = new Configstore(pkg.name);

export async function getGracePeriod(): Promise<number> {
    return await getConfigEntry('gracePeriod', 'Please enter the grace period in days:', 7);
}

export async function getToken(): Promise<string> {
    return await getConfigEntry('token', 'Please enter the OAuth token:');
}

export interface GraylogSettings {
    host: string
    port: number
    facility: string
}

export async function getGraylogSettings(): Promise<GraylogSettings|undefined> {
    if (await getConfigEntry('graylogEnabled', 'Do you want to enable graylog?', false, 'confirm') === true) {
        return {
            host: await getConfigEntry('graylog.host', 'Please enter the graylog host:'),
            port: await getConfigEntry('graylog.port', 'Please enter the graylog port:'),
            facility: await getConfigEntry('graylog.facility', 'Please enter the graylog facility:', 'mmct')
        }
    }
}

async function getConfigEntry(name: string, message: string, defaultValue?: any, type?: string): Promise<any> {
    const value = conf.get(name);

    if (value !== undefined) {
        return value;
    }

    const answers = await inquirer.prompt([{name: 'key', message, default: defaultValue, type}]);
    conf.set(name, answers['key']);

    return answers.token;
}

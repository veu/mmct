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

async function getConfigEntry(name: string, message: string, defaultValue?: any): Promise<any> {
    const value = conf.get(name);

    if (value !== undefined) {
        return value;
    }

    const answers = await inquirer.prompt([{name, message, default: defaultValue}]);
    conf.set(name, answers[name]);

    return answers.token;
}

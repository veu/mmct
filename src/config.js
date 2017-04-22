const Configstore = require('configstore');
const inquirer = require('inquirer');
const pkg = require('../package.json');

const conf = new Configstore(pkg.name);

module.exports = {
    getGracePeriod: async function () {
        return await getConfigEntry('gracePeriod', 'Please enter the grace period in days:', 7);
    },
    getToken: async function () {
        return await getConfigEntry('token', 'Please enter the OAuth token:');
    }
};

async function getConfigEntry(name, message, defaultValue = undefined) {
    const value = conf.get(name);

    if (value !== undefined) {
        return value;
    }

    const answers = await inquirer.prompt([{name, message, default: defaultValue}]);
    conf.set(name, answers[name]);

    return answers.token;
}

#!/usr/bin/env node

const yargs = require('yargs');

require('ts-node').register({
    "fast": true,
    "ignore": false
});

const commands = [
    'copy',
    'fill',
    'init',
    'test',
    'trim'
];

function requireCommand(program, command) {
    const module = require('../src/command/' + command);

    return module.addCommands(program);
}

function requireCommands(program) {
    return Promise.all(commands.map(function (command) {
        return requireCommand(program, command);
    }));
}

function requireNeededCommands(program) {
    if (process.argv[2] === undefined) {
        return new Promise(function (resolve) {
            resolve();
        });
    }

    const command = commands.find(function (command) {
        return process.argv[2].indexOf(command + '-') === 0;
    });

    if (command) {
        return requireCommand(program, command);
    }

    return requireCommands(program);
}

var program = yargs
    .version()
    .usage('$0 <cmd> [args] [options]')
    .command('*', '', {}, function (argv) {
        const command = argv._[0];

        if (command === undefined) {
            console.log('Command missing.');
            return;
        }

        console.log('Unknown command:', command);
    });

requireNeededCommands(program).then(function () {
    program.help().argv;
});

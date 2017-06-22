#!/usr/bin/env node

const yargs = require('yargs');

require('ts-node').register({
    "fast": true,
    "ignore": false
});

const copy = require('../src/command/copy');
const fill = require('../src/command/fill');
const init = require('../src/command/init');
const test = require('../src/command/test');
const trim = require('../src/command/trim');

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

copy.addCommands(program)
    .then(function () {
        return fill.addCommands(program);
    })
    .then(function () {
        return init.addCommands(program);
    })
    .then(function () {
        return test.addCommands(program);
    })
    .then(function () {
        return trim.addCommands(program);
    })
    .then(function () {
        program.help().argv;
    });

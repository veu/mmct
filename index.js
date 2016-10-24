const commands = require('./src/commands');
const program = require('commander');

program
    .version('1.0.0')
    .arguments('<space> <token>')
    .option('-d, --dry-run', 'don’t delete anything', false)
    .option('-g, --grace-period [days]', 'keep anything younger than [days] days, default=5', 5);

program
    .command('assets')
    .description('delete unused assets')
    .action((space, token) => {
        if (typeof space !== 'string' || typeof token !== 'string') {
            console.log('Space ID or OAuth token missing. See --help for syntax.');
            return;
        }
        commands.assets(space, token, program.gracePeriod, program.dryRun);
    });

program.parse(process.argv);
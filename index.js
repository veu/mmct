const commands = require('./src/commands');
const program = require('commander');

program
    .version('1.0.0')
    .arguments('<space> <token> [<field>]')
    .option('-d, --dry-run', 'don’t delete anything', false)
    .option('-g, --grace-period [days]', 'keep anything younger than [days] days, default=5', 5);

program
    .command('orphaned-assets')
    .description('delete unused assets')
    .action((space, token) => {
        if (typeof space !== 'string' || typeof token !== 'string') {
            console.log('Space ID or OAuth token missing. See --help for syntax.');
            return;
        }
        commands.trimOrphanedAssets(space, token, program.gracePeriod, program.dryRun);
    });

program
    .command('outdated-entries')
    .description('delete entries where <field> is older than now')
    .action((space, token, field) => {
        if (typeof space !== 'string' || typeof token !== 'string') {
            console.log('Space ID or OAuth token missing. See --help for syntax.');
            return;
        }
        if (typeof field !== 'string') {
            console.log('Field missing. See --help for syntax.');
            return;
        }
        commands.trimOutdatedEntries(space, token, field, program.gracePeriod, program.dryRun);
    });

program.parse(process.argv);
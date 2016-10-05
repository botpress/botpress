const program = require('commander');

program
  .command('init')
  .description('Create a new bot in current directory')
  .action(function(env, options) {
    console.log('init triggered');
  });

program
  .command('search')
  .description('Search the public repository for modules')
  .action(function(env, options) {
    console.log('search triggered');
  });

program
  .command('start [bot.json]')
  .description('Starts running a bot')
  .action(function(env, options) {
    console.log('start triggered');
  });

program
  .version('0.0.1')
  .description('Easily create, manage and extend chatbots.')
  .parse(process.argv);

if (!program.args.length) {
  program.help();
}

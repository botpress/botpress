import program from 'commander'
import path from 'path'
import fs from 'fs'
import chalk from 'chalk'
import util from './util'

program
  .command('init')
  .description('Create a new bot in current directory')
  .action(function(_, options) {
    console.log('init triggered');
  });

program
  .command('search')
  .description('Search the public repository for modules')
  .action(function(search, options) {
    console.log('search triggered');
  });

program
  .command('start [path]')
  .description('Starts running a bot')
  .option('-s, --skip', 'skip lookup for project local skin installation')
  .action(function(projectPath, options) {
    const skip = !!options.skip;
    let skin = require('./skin');
    projectPath = path.resolve(projectPath || '.');

    if(!skip) {
      try {
        skin = require(path.join(projectPath, 'node_modules', 'botskin'));
      }
      catch (err)
      {
        util.print('warn', 'The project does not have skin installed as a dependency.');
        util.print('Using this installation of skin instead.');
      }
    }

    const botfile = path.join(projectPath, 'botfile.js');
    if(!fs.existsSync(botfile)) {
      util.print('error', `(fatal) No ${chalk.bold('botfile.js')} file found at: ` + botfile);
      process.exit(1);
    }

    const bot = new skin({ botfile });
    bot.start();
  });

program
  .version('0.0.1')
  .description('Easily create, manage and extend chatbots.')
  .parse(process.argv);

if (!program.args.length) {
  program.help();
}

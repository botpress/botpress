import program from 'commander'
import path from 'path'
import fs from 'fs'
import chalk from 'chalk'
import util from '../util'

import init from './init'
import search from './search'
import start from './start'
import create from './create'
import install from './install'

program
  .command('init')
  .description('Create a new bot in current directory')
  .action(init);

program
  .command('search [keyword]')
  .description('Search the public repository for modules')
  .action(search);

program
  .command('start [path]')
  .description('Starts running a bot')
  .option('-s, --skip', 'skip lookup for project local skin installation')
  .action(start);

program
  .command('create')
  .description('Create a new module for development or distribution')
  .action(create);

  program
    .command('install <module>')
    .description('Install module on your current repository')
    .action(install);

program
  .version('0.0.1')
  .description('Easily create, manage and extend chatbots.')
  .parse(process.argv);

if (!program.args.length) {
  program.help();
}

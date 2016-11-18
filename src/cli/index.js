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
import uninstall from './uninstall'
import list from './list'

program
  .command('init')
  .description('Create a new bot in current directory')
  .action(init)

program
  .command('search [keyword]')
  .description('Search the public repository for modules')
  .action(search)

program
  .command('start [path]')
  .alias('s')
  .description('Starts running a bot')
  .option('-s, --skip', 'skip lookup for project local botpress installation')
  .action(start)

program
  .command('install <module> [modules...]')
  .alias('i')
  .description('Add modules to the current bot')
  .action(install)

program
  .command('uninstall <module> [modules...]')
  .alias('u')
  .description('Remove modules from the current bot')
  .action(uninstall)

program
  .command('list')
  .alias('ls')
  .description('List installed modules')
  .action(list)

program
  .command('create')
  .alias('c')
  .description('Create a new module for development or distribution')
  .action(create)

program
  .version('0.0.1')
  .description('Easily create, manage and extend chatbots.')
  .parse(process.argv)

if (!program.args.length) {
  program.help()
}

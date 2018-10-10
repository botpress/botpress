#!/usr/bin/env node

import buildCmd from './build'
import { configure } from './log'
import packageCmd from './package'
import watchCmd from './watch'

require('yargs')
  .command('build', 'builds a botpress module', {}, argv => {
    configure(argv.verbose)
    buildCmd(argv)
  })
  .command('watch', 'watches and rebuilds a module', {}, argv => {
    configure(argv.verbose)
    watchCmd(argv)
  })
  .command(
    'package',
    'packages a module for distribution (.tgz)',
    {
      out: {
        alias: 'o',
        describe: 'the output location of the package',
        default: './%name%_%version%.tgz'
      }
    },
    argv => {
      configure(argv.verbose)
      packageCmd(argv)
    }
  )
  .option('verbose', {
    alias: 'v',
    describe: 'display more info about what is being done'
  })
  .epilogue('for more information, visit https://botpress.io/docs')
  .demandCommand(1)
  .help()
  .wrap(72).argv

import os from 'os'
import yargs from 'yargs'
import installer from './installer'
import logger from './logger'

yargs
  .command(
    ['install', '$0'],
    'Install NLU Server binary at the desired location',
    {
      config: {
        alias: 'c',
        description: 'Path to your config file',
        type: 'string',
        demandOption: true
      },
      output: {
        alias: 'o',
        description: 'Directory where to install the file',
        type: 'string',
        demandOption: true
      },
      platform: {
        alias: 'p',
        choices: ['darwin', 'linux', 'win32'],
        default: os.platform()
      },
      force: {
        alias: 'f',
        type: 'boolean',
        default: false
      }
    },
    argv => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      installer(argv)
        .then(() => {})
        .catch(err => {
          logger.error(`The following error occured: [${err.message}]`)
        })
    }
  )
  .help().argv

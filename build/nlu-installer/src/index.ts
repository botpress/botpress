import os from 'os'
import yargs from 'yargs'
import installer from './installer'

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
      }
    },
    argv => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      installer(argv)
    }
  )
  .help().argv

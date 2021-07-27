import os from 'os'
import path from 'path'
import yargs from 'yargs'
import { cleanFiles, initProject, installFile, listFiles, useFile } from './cli'
import { getAppDataPath } from './utils'

export interface CommonArgs {
  appData: string
  platform: string
  output: string
}

const getCommonArgv = (argv): CommonArgs => {
  const { appData, platform, output } = argv
  return { appData, platform, output }
}

yargs
  .options({
    appData: {
      description: 'Change the location where binaries are stored',
      alias: 'a',
      type: 'string',
      default: process.env.APP_DATA_PATH || getAppDataPath()
    },
    platform: {
      alias: 'p',
      choices: ['darwin', 'linux', 'win32'],
      default: os.platform()
    },
    output: {
      alias: 'o',
      description: 'Choose a different output location',
      default: path.resolve(__dirname, '../../../packages/bp/dist')
    }
  })
  .command(['list', '$0'], 'List available and installed versions of a tool', {}, async (argv: any) => {
    await listFiles(getCommonArgv(argv))
  })
  .command(
    ['init'],
    "Installs the version configured on the project's package.json file",
    {
      config: {
        alias: 'c',
        description: 'Path to the package.json file',
        default: path.resolve(__dirname, '../../../package.json')
      }
    },
    async (argv: any) => {
      await initProject(argv.config, getCommonArgv(argv))
    }
  )
  .command(
    ['install <toolName> [toolVersion]'],
    'Install a different version of a tool. Omit the version to get the latest one',
    {},
    async (argv: any) => {
      yargs
        .positional('toolName', {
          describe: 'Name of the tool to install',
          type: 'string'
        })
        .positional('toolVersion', {
          describe: 'When ommitted, the latest version is installed',
          type: 'string'
        })

      await installFile(argv.toolName, getCommonArgv(argv), argv.toolVersion)
    }
  )
  .command(['clean'], 'Remove all versions of all tools', {}, async (argv: any) => {
    await cleanFiles(argv.appData)
  })

  .command(
    ['use <toolName> <toolVersion>'],
    'Use the specified version of a tool on the current workspace',
    {},
    async (argv: any) => {
      yargs
        .positional('toolName', {
          describe: 'Name of the tool to use',
          type: 'string'
        })
        .positional('toolVersion', {
          type: 'string'
        })

      await useFile(argv.toolName, argv.toolVersion, getCommonArgv(argv))
    }
  )
  .help().argv

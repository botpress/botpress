import fse from 'fs-extra'
import os from 'os'
import path from 'path'
import yargs from 'yargs'
import { cleanFiles, cleanOutdatedBinaries, initProject, installFile, listFiles, useFile } from './cli'
import { getAppDataPath } from './utils'
import { getManager } from './workspace-manager'

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
      await cleanOutdatedBinaries(getCommonArgv(argv))
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
          describe: 'When omitted, the latest version is installed',
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
  .command(['workspace <init|sync>'], 'Manage a workspace including each repository', yargs => {
    let workspaceDir: string | undefined = path.resolve(__dirname, '../../../../')
    if (!fse.pathExistsSync(path.resolve(workspaceDir, '.workspace'))) {
      workspaceDir = undefined
    }

    return yargs
      .options({
        workspace: {
          description: 'Set the location where the workspace is located',
          alias: ['w', 'path'],
          type: 'string',
          required: true,
          default: workspaceDir
        },
        verbose: {
          alias: 'v',
          description: 'Show verbose logs during build',
          type: 'boolean',
          default: false
        },
        skipBuild: {
          alias: 'skip',
          description: 'Skip the build phase',
          type: 'boolean',
          default: false
        },
        quickBuild: {
          alias: 'q',
          description: 'Build in parallel if supported by the repository',
          type: 'boolean',
          default: false
        }
      })
      .command(
        ['init', '$0e'],
        'Setup a new workspace',
        {
          pro: {
            description: 'Includes Botpress Pro in the workspace',
            type: 'boolean',
            default: false
          }
        },
        async argv => {
          await getManager(argv).initializeWorkspace({ usePro: argv.pro })
        }
      )
      .command(
        ['sync'],
        'Sync repositories to what is configured in package.json. If there is no dev branch, it will default to master',
        {
          force: {
            alias: 'f',
            description: 'Force checkout of branches (warning: discards current changes)',
            type: 'boolean',
            default: false
          },
          devMode: {
            alias: 'd',
            description: 'Even if a binary is available for a branch, it will use repositories directly',
            type: 'boolean',
            default: false
          }
        },
        async argv => {
          await getManager(argv).syncWorkspace({ forceCheckout: argv.force, devMode: argv.devMode })
        }
      )
  })
  .help().argv

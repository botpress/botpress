import { Client } from '@botpress/client'
import pathlib from 'path'
import * as uuid from 'uuid'
import impl from '../../src/command-implementations'
import { ApiBot, fetchAllBots } from '../api'
import defaults from '../defaults'
import * as retry from '../retry'
import { Test } from '../typings'
import * as utils from '../utils'

const fetchBot = async (client: Client, botName: string): Promise<ApiBot | undefined> => {
  const bots = await fetchAllBots(client)
  return bots.find(({ name }) => name === botName)
}

export const createDeployBot: Test = {
  name: 'cli should allow creating, building, deploying and mannaging a bot',
  handler: async ({ tmpDir, dependencies, ...creds }) => {
    const botpressHomeDir = pathlib.join(tmpDir, '.botpresshome')
    const baseDir = pathlib.join(tmpDir, 'bots')
    const botName = uuid.v4()
    const botDir = pathlib.join(baseDir, botName)

    const argv = {
      ...defaults,
      botpressHome: botpressHomeDir,
      confirm: true,
      ...creds,
    }

    const client = new Client({
      apiUrl: creds.apiUrl,
      token: creds.token,
      workspaceId: creds.workspaceId,
      retry: retry.config,
    })

    await impl.init({ ...argv, workDir: baseDir, name: botName, type: 'bot' }).then(utils.handleExitCode)
    await utils.fixBotpressDependencies({ workDir: botDir, target: dependencies })
    await utils.npmInstall({ workDir: botDir }).then(utils.handleExitCode)
    await impl.build({ ...argv, workDir: botDir }).then(utils.handleExitCode)
    await impl.login({ ...argv }).then(utils.handleExitCode)
    await impl.bots.subcommands.create({ ...argv, name: botName, ifNotExists: false }).then(utils.handleExitCode)

    const bot = await fetchBot(client, botName)
    if (!bot) {
      throw new Error(`Bot ${botName} should have been created`)
    }

    await impl.deploy({ ...argv, workDir: botDir, createNewBot: false, botId: bot.id }).then(utils.handleExitCode)
    await impl.bots.subcommands.delete({ ...argv, botRef: bot.id }).then(utils.handleExitCode)

    if (await fetchBot(client, botName)) {
      throw new Error(`Bot ${botName} should have been deleted`)
    }
  },
}

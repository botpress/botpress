import { Client } from '@botpress/client'
import * as sdk from '@botpress/sdk'
import fs from 'fs'
import pathlib from 'path'
import * as uuid from 'uuid'
import impl from '../../src'
import { ApiBot, fetchAllBots } from '../api'
import defaults from '../defaults'
import * as retry from '../retry'
import { Test } from '../typings'
import * as utils from '../utils'

type SecretDef = NonNullable<sdk.BotDefinitionProps['secrets']>

const fetchBot = async (client: Client, botName: string): Promise<ApiBot | undefined> => {
  const bots = await fetchAllBots(client)
  return bots.find(({ name }) => name === botName)
}

const appendSecretDefinition = (originalTsContent: string, secrets: SecretDef): string => {
  const secretEntries = Object.entries(secrets)
    .map(([secretName, secretDef]) => `    ${secretName}: ${JSON.stringify(secretDef)},`)
    .join('\n')

  return originalTsContent.replace(
    'new BotDefinition({})',
    `new BotDefinition({\n  secrets: {\n${secretEntries}\n  },\n})`
  )
}

export const requiredBotSecrets: Test = {
  name: 'cli should require required bot secrets',
  handler: async ({ tmpDir, dependencies, ...creds }) => {
    const botpressHomeDir = pathlib.join(tmpDir, '.botpresshome')
    const baseDir = pathlib.join(tmpDir, 'bots')
    const botName = uuid.v4()
    const botDir = pathlib.join(baseDir, botName)

    const definitionPath = pathlib.join(botDir, 'bot.definition.ts')

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

    await impl
      .init({ ...argv, workDir: baseDir, name: botName, type: 'bot', template: 'empty' })
      .then(utils.handleExitCode)

    const originalDefinition: string = fs.readFileSync(definitionPath, 'utf-8')
    const modifiedDefinition = appendSecretDefinition(originalDefinition, {
      REQUIRED_SECRET: {},
      OPTIONAL_SECRET: { optional: true },
    })
    fs.writeFileSync(definitionPath, modifiedDefinition, 'utf-8')

    await utils.fixBotpressDependencies({ workDir: botDir, target: dependencies })
    await utils.npmInstall({ workDir: botDir }).then(utils.handleExitCode)
    await impl.build({ ...argv, workDir: botDir }).then(utils.handleExitCode)
    await impl.login({ ...argv }).then(utils.handleExitCode)
    await impl.bots.create({ ...argv, name: botName, ifNotExists: false }).then(utils.handleExitCode)

    const bot = await fetchBot(client, botName)
    if (!bot) {
      throw new Error(`Bot ${botName} should have been created`)
    }

    const { exitCode } = await impl.deploy({
      ...argv,
      workDir: botDir,
      secrets: ['OPTIONAL_SECRET=lol'],
      botId: bot.id,
      createNewBot: false,
    })
    if (exitCode === 0) {
      throw new Error('Expected deploy to fail')
    }

    await impl
      .deploy({
        ...argv,
        workDir: botDir,
        secrets: ['REQUIRED_SECRET=lol'],
        botId: bot.id,
        createNewBot: false,
      })
      .then(utils.handleExitCode)

    // cleanup deployed bot
    await impl.bots.delete({ ...argv, botRef: bot.id }).then(utils.handleExitCode)

    if (await fetchBot(client, botName)) {
      throw new Error(`Bot ${botName} should have been deleted`)
    }
  },
}
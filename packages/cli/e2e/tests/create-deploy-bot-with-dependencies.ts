import { Client } from '@botpress/client'
import fs from 'fs/promises'
import pathlib from 'path'
import * as uuid from 'uuid'
import impl from '../../src/command-implementations'
import { ApiBot, ApiIntegration, ApiInterface, ApiPlugin } from '../api'
import defaults from '../defaults'
import * as retry from '../retry'
import { Test } from '../typings'
import * as utils from '../utils'

type ARGV = typeof defaults & {
  botpressHome: string
  confirm: true
  workspaceId: string
  workspaceHandle: string
  token: string
  apiUrl: string
  tunnelUrl: string
  sdkPath?: string
  clientPath?: string
}

export const createDeployBotWithDependencies: Test = {
  name: 'cli should allow creating, building, deploying and mannaging a bot that has nested dependencies',
  handler: async ({ tmpDir, dependencies, logger, ...creds }) => {
    if (!_isBotpressWorkspace(creds.workspaceHandle, creds.workspaceId)) {
      // Unfortunately, only the botpress workspace can deploy interfaces
      logger.info(
        `Skipping test because the workspace is not a Botpress workspace (workspaceHandle: ${creds.workspaceHandle}, workspaceId: ${creds.workspaceId})`
      )
      return
    }

    const botpressHomeDir = pathlib.join(tmpDir, '.botpresshome')
    const fixturesDir = pathlib.join(process.cwd(), 'e2e', 'fixtures')
    const interfaceDir = pathlib.join(tmpDir, 'interfaces', 'interface-with-entities')
    const integrationDir = pathlib.join(tmpDir, 'integrations', 'integration-with-entity-dependency')
    const pluginDir = pathlib.join(tmpDir, 'plugins', 'plugin-with-interface-dependency')
    const botDir = pathlib.join(tmpDir, 'bots', 'bot-with-plugin-dependency')

    // copy all subfolders from fixturesDir to tmpDir:
    await fs.cp(fixturesDir, tmpDir, { recursive: true, force: true })

    const argv = {
      ...defaults,
      botpressHome: botpressHomeDir,
      confirm: true,
      ...creds,
    } satisfies ARGV

    const client = new Client({
      apiUrl: creds.apiUrl,
      token: creds.token,
      workspaceId: creds.workspaceId,
      retry: retry.config,
    })
    await impl.login({ ...argv }).then(utils.handleExitCode)

    // Generate names:
    const interfaceName = _generateInterfaceName()
    const integrationName = _generateIntegrationName()
    const pluginName = _generatePluginName()
    const botName = _generateBotName()

    try {
      // Deploy dependencies:
      await _deployInterface({ argv, dependencies, workDir: interfaceDir, interfaceName })
      await _deployIntegration({ argv, dependencies, workDir: integrationDir, integrationName })
      await _deployPlugin({ argv, dependencies, workDir: pluginDir, pluginName })

      // Deploy bot:
      const botId = await _deployBot({ argv, client, dependencies, workDir: botDir, botName })

      // Fetch and verify the deployed bot:
      const deployedBot = await client.getBot({ id: botId }).then((res) => res.bot)

      // TODO: use vitest for our e2e tests and replace this series of if/else
      //       checks with an expect().toMatchObject() assertion.

      // Check that the plugin is installed and enabled:
      if (!deployedBot.plugins?.['plugin-alias']?.enabled) {
        throw new Error('Expected bot to have plugin "plugin-alias"')
      }

      // Check that the schemas have been merged correctly:
      const action = deployedBot.actions?.['plugin-alias#doSomething']
      if (!action?.input?.schema?.properties) {
        throw new Error('Expected bot to have action "plugin-alias#doSomething"')
      }

      const itemEntityProperties = Object.keys(action.input.schema.properties.item.properties)
      // Property defined by the interface:
      if (!itemEntityProperties.includes('name')) {
        throw new Error('Expected "plugin-alias#doSomething" action input to have item.name property')
      }
      // Property defined by the integration:
      if (!itemEntityProperties.includes('color')) {
        throw new Error('Expected "plugin-alias#doSomething" action input to have item.color property')
      }
    } finally {
      // Cleanup
      await _deleteBotIfExists(client, botName)
      await _deletePluginIfExists(client, pluginName)
      await _deleteIntegrationIfExists(client, integrationName)
      await _deleteInterfaceIfExists(client, interfaceName)
    }
  },
}

const _isBotpressWorkspace = (workspaceHandle: string, workspaceId: string): boolean =>
  workspaceHandle === 'botpress' ||
  [
    '6a76fa10-e150-4ff6-8f59-a300feec06c1',
    '95de33eb-1551-4af9-9088-e5dcb02efd09',
    '11111111-1111-1111-aaaa-111111111111',
  ].includes(workspaceId)

const _deployInterface = async ({
  argv,
  workDir,
  interfaceName,
  dependencies,
}: {
  argv: ARGV
  workDir: string
  interfaceName: string
  dependencies: Record<string, string | undefined>
}) => {
  await _editPackageJson({ workDir, interfaceName })
  await _installAndBuild({ argv, workDir, dependencies })

  await impl
    .deploy({ ...argv, workDir, createNewBot: undefined, botId: undefined, public: true })
    .then(utils.handleExitCode)
}

const _deployIntegration = async ({
  argv,
  workDir,
  integrationName,
  dependencies,
}: {
  argv: ARGV
  workDir: string
  integrationName: string
  dependencies: Record<string, string | undefined>
}) => {
  await _editPackageJson({ workDir, integrationName })
  await _installAndBuild({ argv, workDir, dependencies })

  await impl.deploy({ ...argv, workDir, createNewBot: undefined, botId: undefined }).then(utils.handleExitCode)
}

const _deployPlugin = async ({
  argv,
  workDir,
  pluginName,
  dependencies,
}: {
  argv: ARGV
  workDir: string
  pluginName: string
  dependencies: Record<string, string | undefined>
}) => {
  await _editPackageJson({ workDir, pluginName })
  await _installAndBuild({ argv, workDir, dependencies })
  await impl.deploy({ ...argv, workDir, createNewBot: undefined, botId: undefined }).then(utils.handleExitCode)
}

const _deployBot = async ({
  argv,
  client,
  workDir,
  botName,
  dependencies,
}: {
  argv: ARGV
  client: Client
  workDir: string
  botName: string
  dependencies: Record<string, string | undefined>
}) => {
  await _editPackageJson({ workDir, botName })
  await _installAndBuild({ argv, workDir, dependencies })
  await impl.bots.subcommands.create({ ...argv, name: botName, ifNotExists: false }).then(utils.handleExitCode)

  const bot = await _fetchBotByName(client, botName)
  if (!bot) {
    throw new Error(`Bot ${botName} should have been created`)
  }

  await impl.deploy({ ...argv, workDir, createNewBot: false, botId: bot.id }).then(utils.handleExitCode)

  return bot.id
}

const _installAndBuild = async ({
  argv,
  workDir,
  dependencies,
}: {
  argv: ARGV
  workDir: string
  dependencies: Record<string, string | undefined>
}) => {
  await utils.fixBotpressDependencies({ workDir, target: dependencies })
  await utils.npmInstall({ workDir }).then(utils.handleExitCode)

  const prevDir = process.cwd()
  process.chdir(workDir)
  await impl
    .add({ ...argv, installPath: workDir, packageRef: undefined, packageType: undefined, useDev: false })
    .then(utils.handleExitCode)
  process.chdir(prevDir)

  await impl.build({ ...argv, workDir }).then(utils.handleExitCode)
}

const _fetchBotByName = (client: Client, botName: string): Promise<ApiBot | undefined> =>
  client.list
    .bots({})
    .collect()
    .then((bots) => bots.find(({ name }) => name === botName))

const _fetchIntegrationByName = (client: Client, integrationName: string): Promise<ApiIntegration | undefined> =>
  client.list
    .integrations({})
    .collect()
    .then((integrations) => integrations.find(({ name }) => name === integrationName))

const _fetchInterfaceByName = (client: Client, interfaceName: string): Promise<ApiInterface | undefined> =>
  client.list
    .publicInterfaces({})
    .collect()
    .then((interfaces) => interfaces.find(({ name }) => name === interfaceName))

const _fetchPluginByName = (client: Client, pluginName: string): Promise<ApiPlugin | undefined> =>
  client.list
    .plugins({})
    .collect()
    .then((plugins) => plugins.find(({ name }) => name === pluginName))

const _editPackageJson = async (payload: { workDir: string; [k: string]: string }) => {
  const { workDir, ...modifications } = payload
  const packageJsonPath = pathlib.join(workDir, 'package.json')
  const originalPackageJson: Record<string, unknown> = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))

  const newPackageJson = {
    ...originalPackageJson,
    ...modifications,
  }

  await fs.writeFile(packageJsonPath, JSON.stringify(newPackageJson, null, 2))
}

const _generateInterfaceName = () => `iface-${uuid.v4()}` as const
const _generateIntegrationName = () => `integration-${uuid.v4()}` as const
const _generatePluginName = () => `plugin-${uuid.v4()}` as const
const _generateBotName = () => `bot-${uuid.v4()}` as const

const _deleteBotIfExists = async (client: Client, botName: string): Promise<void> => {
  const bot = await _fetchBotByName(client, botName)
  if (!bot) {
    return
  }
  await client.deleteBot({ id: bot.id }).then(() => utils.sleep(10_000))
}

const _deleteIntegrationIfExists = async (client: Client, integrationName: string): Promise<void> => {
  const integration = await _fetchIntegrationByName(client, integrationName)
  if (!integration) {
    return
  }
  await client.deleteIntegration({ id: integration.id })
}

const _deleteInterfaceIfExists = async (client: Client, interfaceName: string): Promise<void> => {
  const iface = await _fetchInterfaceByName(client, interfaceName)
  if (!iface) {
    return
  }
  await client.deleteInterface({ id: iface.id })
}

const _deletePluginIfExists = async (client: Client, pluginName: string): Promise<void> => {
  const plugin = await _fetchPluginByName(client, pluginName)
  if (!plugin) {
    return
  }
  await client.deletePlugin({ id: plugin.id })
}

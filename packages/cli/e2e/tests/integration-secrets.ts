import { Client } from '@botpress/client'
import * as sdk from '@botpress/sdk'
import fs from 'fs'
import pathlib from 'path'
import * as uuid from 'uuid'
import impl from '../../src/command-implementations'
import { fetchAllIntegrations, ApiIntegration } from '../api'
import defaults from '../defaults'
import * as retry from '../retry'
import { Test } from '../typings'
import * as utils from '../utils'

type SecretDef = NonNullable<sdk.IntegrationDefinitionProps['secrets']>

const fetchIntegration = async (client: Client, integrationName: string): Promise<ApiIntegration | undefined> => {
  const integrations = await fetchAllIntegrations(client)
  return integrations.find(({ name }) => name === integrationName)
}

const appendSecretDefinition = (originalTsContent: string, secrets: SecretDef): string => {
  const regex = /( *)version: (['"].*['"]),/
  const replacement = [
    'version: $2,',
    'secrets: {',
    ...Object.entries(secrets).map(([secretName, secretDef]) => `  ${secretName}: ${JSON.stringify(secretDef)},`),
    '},',
  ]
    .map((s) => `$1${s}`) // for indentation
    .join('\n')

  const modifiedTsContent = originalTsContent.replace(regex, replacement)
  return modifiedTsContent
}

export const requiredSecrets: Test = {
  name: 'cli should require required secrets',
  handler: async ({ tmpDir, workspaceHandle, dependencies, ...creds }) => {
    const botpressHomeDir = pathlib.join(tmpDir, '.botpresshome')
    const baseDir = pathlib.join(tmpDir, 'integrations')

    const integrationSuffix = uuid.v4().replace(/-/g, '')
    const name = `myintegration${integrationSuffix}`
    const integrationName = `${workspaceHandle}/${name}`
    const integrationDirName = `${workspaceHandle}-${name}`
    const integrationDir = pathlib.join(baseDir, integrationDirName)

    const definitionPath = pathlib.join(integrationDir, 'integration.definition.ts')

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
      .init({ ...argv, workDir: baseDir, name: integrationName, type: 'integration' })
      .then(utils.handleExitCode)

    const originalDefinition: string = fs.readFileSync(definitionPath, 'utf-8')
    const modifiedDefinition = appendSecretDefinition(originalDefinition, {
      REQUIRED_SECRET: {},
      OPTIONAL_SECRET: { optional: true },
    })
    fs.writeFileSync(definitionPath, modifiedDefinition, 'utf-8')

    await utils.fixBotpressDependencies({ workDir: integrationDir, target: dependencies })
    await utils.npmInstall({ workDir: integrationDir }).then(utils.handleExitCode)
    await impl.build({ ...argv, workDir: integrationDir }).then(utils.handleExitCode)
    await impl.login({ ...argv }).then(utils.handleExitCode)

    const { exitCode } = await impl.deploy({
      ...argv,
      workDir: integrationDir,
      secrets: ['OPTIONAL_SECRET=lol'],
      botId: undefined,
      createNewBot: undefined,
    })
    if (exitCode === 0) {
      throw new Error('Expected deploy to fail')
    }

    await impl
      .deploy({
        ...argv,
        workDir: integrationDir,
        secrets: ['REQUIRED_SECRET=lol'],
        botId: undefined,
        createNewBot: undefined,
      })
      .then(utils.handleExitCode)

    // cleanup deployed integration
    const integration = await fetchIntegration(client, integrationName)
    if (!integration) {
      throw new Error(`Integration ${integrationName} should have been created`)
    }
    await client.deleteIntegration({ id: integration.id })
  },
}

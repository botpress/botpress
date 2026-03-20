import { Client } from '@botpress/client'
import * as sdk from '@botpress/sdk'
import fs from 'fs'
import pathlib from 'path'
import * as uuid from 'uuid'
import impl from '../../src'
import defaults from '../defaults'
import * as retry from '../retry'
import { Test } from '../typings'
import * as utils from '../utils'

type SecretDef = NonNullable<sdk.IntegrationDefinitionProps['secrets']>

const appendSecretDefinition = (originalTsContent: string, secrets: SecretDef): string => {
  const secretEntries = Object.entries(secrets)
    .map(([secretName, secretDef]) => `    ${secretName}: ${JSON.stringify(secretDef)},`)
    .join('\n')

  const modifiedContent = originalTsContent.replace(
    /(new IntegrationDefinition\(\{)/,
    `$1\n  secrets: {\n${secretEntries}\n  },\n`
  )

  if (modifiedContent === originalTsContent) {
    throw new Error('Failed to inject secrets into integration definition')
  }

  return modifiedContent
}

export const requiredIntegrationSecrets: Test = {
  name: 'cli should require required integration secrets',
  handler: async ({ tmpDir, workspaceHandle, dependencies, ...creds }) => {
    const botpressHomeDir = pathlib.join(tmpDir, '.botpresshome')
    const baseDir = pathlib.join(tmpDir, 'integrations')

    const integrationSuffix = uuid.v4().replace(/-/g, '')
    const name = `myintegration${integrationSuffix}`
    const integrationName = `${workspaceHandle}/${name}`
    const integrationDir = pathlib.join(baseDir, name)

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
      .init({ ...argv, workDir: baseDir, name: integrationName, type: 'integration', template: 'empty' })
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
    const { integration: deployedIntegration } = await client.getIntegrationByName({
      name: integrationName,
      version: '0.1.0',
    })
    if (!deployedIntegration.secrets.includes('REQUIRED_SECRET')) {
      throw new Error(
        `Integration ${integrationName} should have secrets REQUIRED_SECRET and OPTIONAL_SECRET, got: ${deployedIntegration.secrets.join(', ')}`
      )
    }
    await client.deleteIntegration({ id: deployedIntegration.id })
  },
}

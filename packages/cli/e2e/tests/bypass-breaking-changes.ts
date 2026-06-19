import { Client } from '@botpress/client'
import fs from 'fs'
import pathlib from 'path'
import * as uuid from 'uuid'
import impl from '../../src'
import { ApiIntegration, fetchAllIntegrations } from '../api'
import defaults from '../defaults'
import * as retry from '../retry'
import { Test } from '../typings'
import * as utils from '../utils'

const fetchIntegration = async (client: Client, integrationName: string): Promise<ApiIntegration | undefined> => {
  const integrations = await fetchAllIntegrations(client)
  return integrations.find(({ name }) => name === integrationName)
}

const applyReplacement = (content: string, search: string, replacement: string, label: string): string => {
  if (!content.includes(search)) {
    throw new Error(
      `Test fixture error: could not find "${label}" in integration.definition.ts — template may have changed`
    )
  }
  return content.replace(search, replacement)
}

const withAction = (originalTsContent: string): string =>
  applyReplacement(
    applyReplacement(
      originalTsContent,
      "import { IntegrationDefinition } from '@botpress/sdk'",
      "import { IntegrationDefinition, z } from '@botpress/sdk'",
      'IntegrationDefinition import'
    ),
    'new IntegrationDefinition({',
    `new IntegrationDefinition({
  actions: {
    myAction: {
      input: { schema: z.object({ existingField: z.string() }) },
      output: { schema: z.object({}) },
    },
  },`,
    'IntegrationDefinition constructor'
  )

const withBreakingChange = (tsContent: string): string =>
  applyReplacement(
    tsContent,
    'existingField: z.string()',
    'existingField: z.string(), newRequiredField: z.string()',
    'existingField in action input schema'
  )

const withBumpedVersion = (tsContent: string): string =>
  applyReplacement(tsContent, "version: '0.1.0'", "version: '0.1.1'", 'version field')

export const bypassBreakingChanges: Test = {
  name: 'cli should allow bypassing breaking changes with --bypassBreakingChanges',
  handler: async ({ tmpDir, workspaceHandle, dependencies, logger, ...creds }) => {
    if (workspaceHandle !== 'botpress') {
      logger.info('Skipping test: bypassBreakingChanges is only supported for Botpress internal workspaces')
      return
    }
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

    await utils.fixBotpressDependencies({ workDir: integrationDir, target: dependencies })
    await utils.npmInstall({ workDir: integrationDir }).then(utils.handleExitCode)

    // initial deploy: action with one existing input field, public so breaking change check applies
    const originalDefinition = fs.readFileSync(definitionPath, 'utf-8')
    fs.writeFileSync(definitionPath, withAction(originalDefinition), 'utf-8')
    await impl.build({ ...argv, workDir: integrationDir }).then(utils.handleExitCode)
    await impl.login({ ...argv }).then(utils.handleExitCode)
    await impl
      .deploy({ ...argv, workDir: integrationDir, visibility: 'public', botId: undefined, createNewBot: undefined })
      .then(utils.handleExitCode)

    // introduce a breaking change: bump version and add a new required field to the existing action
    const actionDefinition = fs.readFileSync(definitionPath, 'utf-8')
    fs.writeFileSync(definitionPath, withBumpedVersion(withBreakingChange(actionDefinition)), 'utf-8')
    await impl.build({ ...argv, workDir: integrationDir }).then(utils.handleExitCode)

    // deploy without bypass flag — should fail
    const { exitCode } = await impl.deploy({
      ...argv,
      workDir: integrationDir,
      visibility: 'public',
      bypassBreakingChanges: false,
      botId: undefined,
      createNewBot: undefined,
    })
    if (exitCode === 0) {
      throw new Error('Expected deploy to fail due to breaking changes')
    }

    // deploy with bypass flag — should succeed
    await impl
      .deploy({
        ...argv,
        workDir: integrationDir,
        visibility: 'public',
        bypassBreakingChanges: true,
        botId: undefined,
        createNewBot: undefined,
      })
      .then(utils.handleExitCode)

    // cleanup
    const integration = await fetchIntegration(client, integrationName)
    if (integration) {
      await impl.integrations.delete({ ...argv, integrationRef: integration.id }).then(utils.handleExitCode)
    }
  },
}

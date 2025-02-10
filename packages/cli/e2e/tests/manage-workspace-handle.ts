import { Client } from '@botpress/client'
import pathlib from 'path'
import impl from '../../src/command-implementations'
import { ApiIntegration, fetchAllIntegrations } from '../api'
import defaults from '../defaults'
import * as retry from '../retry'
import { Test } from '../typings'
import * as utils from '../utils'

const fetchIntegration = async (client: Client, integrationName: string): Promise<ApiIntegration | undefined> => {
  const integrations = await fetchAllIntegrations(client)
  return integrations.find(({ name }) => name === integrationName)
}

export const prependWorkspaceHandle: Test = {
  name: 'cli should automatically preprend the workspace handle to the integration name when deploying',
  handler: async ({ tmpDir, dependencies, workspaceHandle, logger, ...creds }) => {
    const botpressHomeDir = pathlib.join(tmpDir, '.botpresshome')
    const baseDir = pathlib.join(tmpDir, 'integrations')

    const integrationSuffix = utils.getUUID()
    const integrationName = `myintegration${integrationSuffix}`
    const integrationDirName = integrationName
    const integrationDir = pathlib.join(baseDir, integrationDirName)

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
    await utils.fixBotpressDependencies({ workDir: integrationDir, target: dependencies })
    await utils.npmInstall({ workDir: integrationDir }).then(utils.handleExitCode)
    await impl.build({ ...argv, workDir: integrationDir }).then(utils.handleExitCode)
    await impl.login({ ...argv }).then(utils.handleExitCode)

    await impl
      .deploy({ ...argv, createNewBot: undefined, botId: undefined, workDir: integrationDir })
      .then(utils.handleExitCode)

    logger.debug(`Fetching integration "${integrationName}"`)
    let integration = await fetchIntegration(client, integrationName)
    if (integration) {
      throw new Error(`Integration ${integrationName} should not have been created`)
    }

    const expectedIntegrationName = `${workspaceHandle}/${integrationName}`
    logger.debug(`Fetching integration "${expectedIntegrationName}"`)
    integration = await fetchIntegration(client, expectedIntegrationName)
    if (!integration) {
      throw new Error(`Integration ${expectedIntegrationName} should have been created`)
    }

    logger.debug(`Deleting integration "${integrationName}"`)
    await impl.integrations.subcommands.delete({ ...argv, integrationRef: integration.id }).then(({ exitCode }) => {
      exitCode !== 0 && logger.warn(`Failed to delete integration "${integrationName}"`) // not enough to fail the test
    })
  },
}

export const enforceWorkspaceHandle: Test = {
  name: 'cli should fail when attempting to deploy an integration with incorrect workspace handle',
  handler: async ({ tmpDir, dependencies, ...creds }) => {
    const botpressHomeDir = pathlib.join(tmpDir, '.botpresshome')
    const baseDir = pathlib.join(tmpDir, 'integrations')

    const randomSuffix = utils.getUUID().slice(0, 8)

    const name = 'myintegration'
    const handle = `myhandle${randomSuffix}`
    const integrationName = `${handle}/${name}`
    const integrationDirName = `${handle}-${name}`
    const integrationDir = pathlib.join(baseDir, integrationDirName)

    const argv = {
      ...defaults,
      botpressHome: botpressHomeDir,
      confirm: true,
      ...creds,
    }

    await impl
      .init({ ...argv, workDir: baseDir, name: integrationName, type: 'integration' })
      .then(utils.handleExitCode)
    await utils.fixBotpressDependencies({ workDir: integrationDir, target: dependencies })
    await utils.npmInstall({ workDir: integrationDir }).then(utils.handleExitCode)
    await impl.login({ ...argv }).then(utils.handleExitCode)

    const { exitCode } = await impl.deploy({
      ...argv,
      createNewBot: undefined,
      botId: undefined,
      workDir: integrationDir,
    })

    if (exitCode === 0) {
      throw new Error(`Integration ${integrationName} should not have been deployed`)
    }
  },
}

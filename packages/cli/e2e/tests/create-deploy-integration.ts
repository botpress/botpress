import { Client } from '@botpress/client'
import pathlib from 'path'
import * as uuid from 'uuid'
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

export const createDeployIntegration: Test = {
  name: 'cli should allow creating, building, deploying and mannaging an integration',
  handler: async ({ tmpDir, dependencies, workspaceHandle, logger, ...creds }) => {
    const botpressHomeDir = pathlib.join(tmpDir, '.botpresshome')
    const baseDir = pathlib.join(tmpDir, 'integrations')

    const integrationSuffix = uuid.v4().replace(/-/g, '')
    const name = `myintegration${integrationSuffix}`
    const integrationName = `${workspaceHandle}/${name}`
    const integrationDirName = `${workspaceHandle}-${name}`
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
    const integration = await fetchIntegration(client, integrationName)
    if (!integration) {
      throw new Error(`Integration ${integrationName} should have been created`)
    }

    logger.debug(`Deleting integration "${integrationName}"`)
    await impl.integrations.subcommands.delete({ ...argv, integrationRef: integration.id }).then(utils.handleExitCode)

    if (await fetchIntegration(client, integrationName)) {
      throw new Error(`Integration ${integrationName} should have been deleted`)
    }
  },
}

import { Client } from '@botpress/client'

import pathlib from 'path'
import * as uuid from 'uuid'
import impl from '../../src/command-implementations'
import { ApiIntegration, fetchAllIntegrations } from '../api'
import defaults from '../defaults'
import { Test } from '../typings'
import * as utils from '../utils'

const fetchIntegration = async (client: Client, integrationName: string): Promise<ApiIntegration | undefined> => {
  const integrations = await fetchAllIntegrations(client)
  return integrations.find(({ name }) => name === integrationName)
}

export const createDeployIntegration: Test = {
  name: 'cli should allow creating, building, deploying and mannaging an integration',
  handler: async ({ tmpDir, ...creds }) => {
    const botpressHomeDir = pathlib.join(tmpDir, '.botpresshome')
    const baseDir = pathlib.join(tmpDir, 'integrations')
    const integrationName = `myintegration-${uuid.v4()}`.replace(/-/g, '')
    const integrationDir = pathlib.join(baseDir, integrationName)

    const argv = {
      ...defaults,
      botpressHome: botpressHomeDir,
      confirm: true,
      ...creds,
    }

    const client = new Client({ host: creds.apiUrl, token: creds.token, workspaceId: creds.workspaceId })

    await impl
      .init({ ...argv, workDir: baseDir, name: integrationName, type: 'integration' })
      .then(utils.handleExitCode)
    await utils.npmInstall({ workDir: integrationDir }).then(utils.handleExitCode)
    await impl.build({ ...argv, workDir: integrationDir }).then(utils.handleExitCode)
    await impl.login({ ...argv }).then(utils.handleExitCode)

    await impl
      .deploy({ ...argv, createNewBot: undefined, botId: undefined, workDir: integrationDir })
      .then(utils.handleExitCode)

    const integration = await fetchIntegration(client, integrationName)
    if (!integration) {
      throw new Error(`Integration ${integrationName} should have been created`)
    }

    await impl.integrations.subcommands.delete({ ...argv, integrationRef: integration.id }).then(utils.handleExitCode)

    if (await fetchIntegration(client, integrationName)) {
      throw new Error(`Integration ${integrationName} should have been deleted`)
    }
  },
}

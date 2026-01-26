import * as sdk from '@botpress/sdk'
import type * as vanillaClient from '@botpress/client'
import { randomUUID } from '../utils/crypto'
import * as bp from '.botpress'
import { WORKFLOW_ACTIVE_STATUSES } from '../consts'
import * as SyncQueue from '../sync-queue'
import { getAliasedName } from '../utils/get-aliased-name'

export const callAction: bp.PluginHandlers['actionHandlers']['syncFilesToBotpess'] = async (props) => {
  const { includeFiles, integrationInstanceAlias } = props.input

  await _assertSyncNotAlreadyInProgress(props)
  _assertAtLeastOneFileToSync(includeFiles)

  const { integrationName, transferFileToBotpressAlias } = await _getIntegrationDetails(props)

  const syncJobId = await randomUUID()
  const fileKey = _generateFileKey({
    integrationInstanceAlias,
    pluginInstanceAlias: props.alias,
    syncJobId,
  })

  props.logger.info(
    `Starting synchronization workflow for integration instance with alias "${integrationInstanceAlias}"`,
    { syncJobId, fileKey, filesCount: includeFiles.length }
  )

  const syncInitiatedAt = new Date().toISOString()

  props.logger.debug('Uploading sync queue job file...', { syncJobId, fileKey })
  const jobFileId = await SyncQueue.jobFileManager.updateSyncQueue(
    props,
    fileKey,
    includeFiles.map((file) => ({
      id: file.id,
      name: file.name,
      absolutePath: file.absolutePath,
      type: 'file',
      status: 'pending',
      sizeInBytes: file.sizeInBytes,
      addToKbId: props.input.addToKbId,
    })),
    {
      syncJobId,
      integrationName,
      integrationInstanceAlias,
      syncInitiatedAt,
    }
  )

  props.logger.debug('Starting processQueue workflow...', { syncJobId, jobFileId })
  await props.workflows.processQueue.startNewInstance({
    input: {
      jobFileId,
      transferFileToBotpressAlias,
    },
    tags: {
      integrationDefinitionName: integrationName,
      integrationInstanceAlias,
      syncJobId,
      syncInitiatedAt,
    },
  })

  return { syncJobId }
}

const _assertSyncNotAlreadyInProgress = async (
  props: Extract<bp.ActionHandlerProps, { type?: 'syncFilesToBotpess' }>
) => {
  const { integrationInstanceAlias } = props.input

  const workflowsInProgress = await props.workflows.processQueue
    .listInstances({
      statuses: [...WORKFLOW_ACTIVE_STATUSES],
      tags: {
        integrationInstanceAlias: integrationInstanceAlias,
      },
    })
    .take(1)

  if (workflowsInProgress.length > 0) {
    throw new sdk.RuntimeError(
      `A synchronization is already in progress for integration instance with alias "${integrationInstanceAlias}". Please wait for it to complete before starting a new one.`
    )
  }
}

const _assertAtLeastOneFileToSync = (includeFiles: unknown[]) => {
  if (includeFiles.length === 0) {
    throw new sdk.RuntimeError('No files specified for synchronization.')
  }
}

const _generateFileKey = (props: {
  integrationInstanceAlias: string
  pluginInstanceAlias: string
  syncJobId: string
}) =>
  `${getAliasedName('knowledge-connector', props.pluginInstanceAlias)}:${props.integrationInstanceAlias}:/${props.syncJobId}.jsonl`

const _getIntegrationDetails = async (props: Extract<bp.ActionHandlerProps, { type?: 'syncFilesToBotpess' }>) => {
  // Cast the client to access getBot, and set the header for multiple integrations:
  const client = props.client as unknown as vanillaClient.Client
  const axiosHeaders = (client as any).axiosInstance.defaults.headers.get
  axiosHeaders['x-multiple-integrations'] = 'true'

  // Retrieve the integration instances:
  const { bot } = await client.getBot({ id: props.ctx.botId, shouldMergePlugins: true })
  const integrationInstance = bot.integrations[props.input.integrationInstanceAlias]

  if (!integrationInstance?.enabled) {
    throw new sdk.RuntimeError(
      `Integration instance with alias "${props.input.integrationInstanceAlias}" not found in bot "${props.ctx.botId}".`
    )
  }

  // Retrieve the interface implementation statement:
  const integrationDefinition = await _getIntegrationDefinition({ client, integrationId: integrationInstance.id })

  const interfaceImpl = integrationDefinition.interfaces[props.input.interfaceAlias]

  if (!interfaceImpl || interfaceImpl.name !== 'files-readonly') {
    throw new sdk.RuntimeError(
      `Integration instance with alias "${props.input.integrationInstanceAlias}" does not implement the "files-readonly" interface with alias "${props.input.interfaceAlias}".`
    )
  }

  if (interfaceImpl.version.split('.')[0] !== '0') {
    throw new sdk.RuntimeError(
      `Integration instance with alias "${props.input.integrationInstanceAlias}" implements an unsupported version of the "files-readonly" interface. Expected version "0.x.x", got "${interfaceImpl.version}".`
    )
  }

  // Retrieve the alias of the transferFileToBotpress action:
  const actionAlias = interfaceImpl.actions['transferFileToBotpress']?.name

  if (!actionAlias) {
    throw new sdk.RuntimeError(
      `Integration instance with alias "${props.input.integrationInstanceAlias}" does not have the "transferFileToBotpress" action defined in the "files-readonly" interface.`
    )
  }

  return {
    integrationName: integrationDefinition.name,
    integrationInstanceAlias: props.input.integrationInstanceAlias,
    transferFileToBotpressAlias: actionAlias,
  }
}

const _getIntegrationDefinition = async (props: { client: vanillaClient.Client; integrationId: string }) => {
  let integrationDefinition: vanillaClient.ClientOutputs['getIntegration']['integration'] | undefined = undefined

  try {
    const { integration } = await props.client.getIntegration({ id: props.integrationId })
    integrationDefinition = integration
  } catch {}

  if (!integrationDefinition) {
    try {
      const { integration } = await props.client.getPublicIntegrationById({ id: props.integrationId })
      integrationDefinition = integration
    } catch {}
  }

  if (!integrationDefinition) {
    throw new sdk.RuntimeError(`Integration definition with ID "${props.integrationId}" not found.`)
  }

  return integrationDefinition
}

import * as sdk from '@botpress/sdk'
import { WORKFLOW_ACTIVE_STATUSES } from '../consts'
import * as SyncQueue from '../sync-queue'
import { randomUUID } from '../utils/crypto'
import { getAliasedName } from '../utils/get-aliased-name'
import * as bp from '.botpress'

export const callAction: bp.PluginHandlers['actionHandlers']['syncFilesToBotpress'] = async (props) => {
  const { includeFiles, integrationInstanceAlias, integrationDefinitionName, transferFileToBotpressAlias } = props.input

  await _assertSyncNotAlreadyInProgress(props)
  _assertAtLeastOneFileToSync(includeFiles)

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
      integrationName: integrationDefinitionName,
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
      integrationDefinitionName,
      integrationInstanceAlias,
      syncJobId,
      syncInitiatedAt,
    },
  })

  return { syncJobId }
}

const _assertSyncNotAlreadyInProgress = async (
  props: Extract<bp.ActionHandlerProps, { type?: 'syncFilesToBotpress' }>
) => {
  const { integrationInstanceAlias } = props.input

  const workflowsInProgress = await props.workflows.processQueue
    .listInstances({
      statuses: [...WORKFLOW_ACTIVE_STATUSES],
      tags: {
        integrationInstanceAlias,
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

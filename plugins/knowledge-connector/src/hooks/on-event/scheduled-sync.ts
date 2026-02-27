import { WORKFLOW_ACTIVE_STATUSES } from '../../consts'
import * as SyncQueue from '../../sync-queue'
import { randomUUID } from '../../utils/crypto'
import { enumerateFilesInFolder } from '../../utils/enumerate-files'
import { getAliasedName } from '../../utils/get-aliased-name'
import type * as bp from '.botpress'

type ScheduledSyncProps = bp.EventHandlerProps

type IntegrationGroup = {
  integrationInstanceAlias: string
  integrationDefinitionName: string
  transferFileToBotpressAlias: string
  folders: Array<{ folderId: string; path: string; kbId: string }>
}

export const handleEvent = async (props: ScheduledSyncProps) => {
  const { logger, ctx } = props

  logger.info('[scheduledSync] handleEvent called')

  const settings = await _getFolderSyncSettings(props)
  logger.info(`[scheduledSync] folderSyncSettings=${settings ? JSON.stringify(settings).slice(0, 500) : 'null'}`)
  if (!settings) {
    logger.info('[scheduledSync] SKIPPED: no folder sync settings found')
    return
  }

  const integrationGroups = _groupFoldersByIntegration(settings)
  if (integrationGroups.length === 0) {
    logger.debug('Scheduled sync skipped: no folders with integration info configured')
    return
  }

  logger.info(`Scheduled sync starting for ${integrationGroups.length} integration(s)`)

  for (const group of integrationGroups) {
    try {
      await _syncIntegrationGroup(props, group)
    } catch (error) {
      logger.error(
        `Scheduled sync failed for integration "${group.integrationInstanceAlias}": ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  await props.states.bot.lastScheduledSync.set(ctx.botId, {
    lastSyncAt: new Date().toISOString(),
  })
}

const _hasEnoughTimeElapsed = async (props: ScheduledSyncProps, intervalHours: number): Promise<boolean> => {
  try {
    const { lastSyncAt } = await props.states.bot.lastScheduledSync.get(props.ctx.botId)
    if (!lastSyncAt) {
      return true
    }
    const elapsed = Date.now() - new Date(lastSyncAt).getTime()
    return elapsed >= intervalHours * 60 * 60 * 1000
  } catch {
    return true
  }
}

const _getFolderSyncSettings = async (props: ScheduledSyncProps) => {
  try {
    const state = await props.states.bot.folderSyncSettings.get(props.ctx.botId)
    return state?.settings
  } catch {
    return null
  }
}

const _groupFoldersByIntegration = (
  settings: Record<string, Record<string, Record<string, unknown>>>
): IntegrationGroup[] => {
  const groupMap = new Map<string, IntegrationGroup>()

  for (const [kbId, folders] of Object.entries(settings)) {
    for (const [folderId, folderConfig] of Object.entries(folders)) {
      const config = folderConfig as {
        syncNewFiles?: boolean
        path?: string
        integrationInstanceAlias?: string
        integrationDefinitionName?: string
        transferFileToBotpressAlias?: string
      }

      if (!config.integrationInstanceAlias || !config.integrationDefinitionName) {
        continue
      }

      const alias = config.integrationInstanceAlias
      let group = groupMap.get(alias)
      if (!group) {
        group = {
          integrationInstanceAlias: alias,
          integrationDefinitionName: config.integrationDefinitionName,
          transferFileToBotpressAlias: config.transferFileToBotpressAlias ?? 'filesReadonlyTransferFileToBotpress',
          folders: [],
        }
        groupMap.set(alias, group)
      }

      group.folders.push({
        folderId,
        path: config.path ?? '/',
        kbId,
      })
    }
  }

  return Array.from(groupMap.values())
}

const _syncIntegrationGroup = async (props: ScheduledSyncProps, group: IntegrationGroup) => {
  const { logger } = props

  const isBusy = await _isSyncInProgress(props, group.integrationInstanceAlias)
  if (isBusy) {
    logger.info(`Scheduled sync skipped for "${group.integrationInstanceAlias}": sync already in progress`)
    return
  }

  const allFiles: Array<{ id: string; name: string; absolutePath: string; sizeInBytes?: number; kbId: string }> = []

  for (const folder of group.folders) {
    const files = await enumerateFilesInFolder({
      listItemsInFolder: props.actions['files-readonly'].listItemsInFolder,
      folderId: folder.folderId,
      folderPath: folder.path,
      logger,
    })

    for (const file of files) {
      allFiles.push({ ...file, kbId: folder.kbId })
    }
  }

  if (allFiles.length === 0) {
    logger.info(`Scheduled sync: no files found for integration "${group.integrationInstanceAlias}"`)
    return
  }

  // Group files by kbId to create separate sync jobs per knowledge base
  const filesByKb = new Map<string, typeof allFiles>()
  for (const file of allFiles) {
    const existing = filesByKb.get(file.kbId) ?? []
    existing.push(file)
    filesByKb.set(file.kbId, existing)
  }

  for (const [kbId, files] of filesByKb) {
    const syncJobId = await randomUUID()
    const fileKey = `${getAliasedName('knowledge-connector', props.alias)}:${group.integrationInstanceAlias}:/${syncJobId}.jsonl`
    const syncInitiatedAt = new Date().toISOString()

    logger.info(
      `Scheduled sync: starting job for "${group.integrationInstanceAlias}" KB "${kbId}" with ${files.length} files`,
      { syncJobId }
    )

    const jobFileId = await SyncQueue.jobFileManager.updateSyncQueue(
      props,
      fileKey,
      files.map((file) => ({
        id: file.id,
        name: file.name,
        absolutePath: file.absolutePath,
        type: 'file' as const,
        status: 'pending' as const,
        sizeInBytes: file.sizeInBytes,
        addToKbId: kbId,
      })),
      {
        syncJobId,
        integrationName: group.integrationDefinitionName,
        integrationInstanceAlias: group.integrationInstanceAlias,
        syncInitiatedAt,
      }
    )

    await props.workflows.processQueue.startNewInstance({
      input: {
        jobFileId,
        transferFileToBotpressAlias: group.transferFileToBotpressAlias,
      },
      tags: {
        integrationDefinitionName: group.integrationDefinitionName,
        integrationInstanceAlias: group.integrationInstanceAlias,
        syncJobId,
        syncInitiatedAt,
      },
    })
  }
}

const _isSyncInProgress = async (props: ScheduledSyncProps, integrationInstanceAlias: string): Promise<boolean> => {
  const workflowsInProgress = await props.workflows.processQueue
    .listInstances({
      statuses: [...WORKFLOW_ACTIVE_STATUSES],
      tags: { integrationInstanceAlias },
    })
    .take(1)

  return workflowsInProgress.length > 0
}

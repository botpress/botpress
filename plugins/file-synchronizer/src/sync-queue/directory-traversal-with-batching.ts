import * as sdk from '@botpress/sdk'
import type * as models from '../../definitions/models'
import * as syncQueueGlobMatcher from './glob-matcher'
import * as bp from '.botpress'

type FileWithOptions = models.FileWithPath & { shouldIndex: boolean; addToKbId?: string }

export type EnumerationState = NonNullable<bp.states.States['buildQueueRuntimeState']['payload']['enumerationState']>

type IntegrationActionProxy = Pick<
  bp.WorkflowHandlerProps['processQueue']['actions']['files-readonly'],
  'listItemsInFolder'
>

export type EnumerateAllFilesRecursiveProps = {
  logger: sdk.BotLogger
  integration: IntegrationActionProxy
  configuration: Pick<bp.configuration.Configuration, 'includeFiles' | 'excludeFiles'>
  currentEnumerationState?: EnumerationState
  maximumExecutionTimeMs?: number
  globMatcher?: {
    matchItem: (props: syncQueueGlobMatcher.GlobMatcherProps) => syncQueueGlobMatcher.GlobMatchResult
  }
  pushFilesToQueue: (files: FileWithOptions[]) => Promise<void>
}

// 30 seconds should be a safe default for the max execution time:
const DEFAULT_MAXIMUM_EXECUTION_TIME_MS = 30_000

export const enumerateAllFilesRecursive = async ({
  logger,
  integration,
  configuration,
  currentEnumerationState,
  maximumExecutionTimeMs = DEFAULT_MAXIMUM_EXECUTION_TIME_MS,
  globMatcher = syncQueueGlobMatcher,
  pushFilesToQueue: pushFilesToSyncQueue,
}: EnumerateAllFilesRecursiveProps): Promise<EnumerationState | undefined> => {
  const enumerationState: EnumerationState = currentEnumerationState ?? {
    pendingFolders: [{ absolutePath: '/' }],
  }

  const includedFiles: FileWithOptions[] = []
  const startTime = Date.now()

  while (enumerationState.pendingFolders.length > 0) {
    const { items: folderItems, nextToken } = await _listFolderContents(integration, enumerationState)

    for (const folderItem of folderItems) {
      const currentFolder = enumerationState.pendingFolders[0]!
      const itemPath = `${currentFolder.absolutePath}${folderItem.name}`
      const globMatchResult = globMatcher.matchItem({ configuration, item: folderItem, itemPath })

      if (globMatchResult.shouldBeIgnored) {
        logger.debug(
          'Ignoring item',
          { itemPath, reason: globMatchResult.reason },
          JSON.stringify({ item: folderItem, configuration })
        )
        continue
      }

      if (folderItem.type === 'folder') {
        _addFolderToEnumerationQueue(enumerationState, folderItem.id, itemPath)
      } else {
        _addFileToIncludedFiles(includedFiles, folderItem, itemPath, globMatchResult, logger)
      }
    }

    if (nextToken) {
      enumerationState.currentFolderNextToken = nextToken

      if (_isTimeoutReached(startTime, maximumExecutionTimeMs)) {
        await pushFilesToSyncQueue(includedFiles)
        return enumerationState
      }
    } else {
      enumerationState.pendingFolders.shift()
      enumerationState.currentFolderNextToken = undefined
    }
  }

  await pushFilesToSyncQueue(includedFiles)
  return undefined
}

const _isTimeoutReached = (startTime: number, maximumExecutionTimeMs: number): boolean =>
  Date.now() - startTime >= maximumExecutionTimeMs

const _listFolderContents = async (integration: IntegrationActionProxy, enumerationState: EnumerationState) => {
  const folder = enumerationState.pendingFolders[0]!
  const response = await integration.listItemsInFolder({
    folderId: folder.folderId,
    nextToken: enumerationState.currentFolderNextToken,
  })

  return {
    items: response.items,
    nextToken: response.meta.nextToken,
  }
}

const _addFolderToEnumerationQueue = (
  enumerationState: EnumerationState,
  folderId: string | undefined,
  itemPath: string
): void => {
  enumerationState.pendingFolders.push({
    folderId,
    absolutePath: `${itemPath}/`,
  })
}

const _addFileToIncludedFiles = (
  includedFiles: FileWithOptions[],
  folderItem: models.File,
  itemPath: string,
  globMatchResult: syncQueueGlobMatcher.GlobMatchResult,
  logger: sdk.BotLogger
): void => {
  if (globMatchResult.shouldBeIgnored) {
    return
  }

  logger.debug('Including file', itemPath)
  includedFiles.push({
    ...folderItem,
    absolutePath: itemPath,
    shouldIndex: (globMatchResult.shouldApplyOptions.addToKbId?.length ?? 0) > 0,
    addToKbId: globMatchResult.shouldApplyOptions.addToKbId,
  })
}

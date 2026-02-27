import * as SyncQueue from '../../sync-queue'
import { createIntegrationTransferHandler } from '../../utils/create-integration-transfer-handler'
import { extractIntegrationAlias } from '../../utils/extract-integration-alias'
import { findFolderByPath } from '../../utils/find-folder-by-path'
import * as bp from '.botpress'

export const handleEvent: bp.EventHandlers['*'] = async (props) => {
  const createdFile = props.event.payload.file

  const integrationAlias = extractIntegrationAlias(props.event.type, props.logger)
  if (!integrationAlias) {
    return
  }

  let settings
  try {
    settings = await props.states.bot.folderSyncSettings.get(props.ctx.botId)
  } catch {
    return
  }

  if (!settings?.settings) {
    return
  }

  const folderMatch = findFolderByPath(settings.settings, createdFile.absolutePath)

  if (!folderMatch || !folderMatch.syncNewFiles) {
    return
  }

  const { kbId } = folderMatch

  await SyncQueue.fileProcessor.processQueueFile({
    fileRepository: props.client,
    fileToSync: {
      ...createdFile,
      status: 'pending',
      addToKbId: kbId,
    },
    integration: createIntegrationTransferHandler({
      integrationName: integrationAlias,
      integrationAlias,
      client: props.client,
      shouldIndex: kbId !== undefined,
    }),
    logger: props.logger,
  })

  props.logger.info(`File ${createdFile.absolutePath} has been synchronized`)
}

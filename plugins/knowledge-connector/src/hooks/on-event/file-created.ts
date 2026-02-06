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

  const folderSyncSettingsState = await props.client.getState({
    type: 'bot',
    id: props.ctx.botId,
    name: 'folderSyncSettings',
  })

  if (!folderSyncSettingsState?.state?.payload?.settings) {
    return
  }

  const folderMatch = findFolderByPath(folderSyncSettingsState.state.payload.settings, createdFile.absolutePath)

  if (!folderMatch || !folderMatch.syncNewFiles) {
    props.logger.debug(
      `File ${createdFile.absolutePath} does not match any folder with syncNewFiles enabled. Skipping.`
    )
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

import { extractIntegrationAlias } from '../../utils/extract-integration-alias'
import * as bp from '.botpress'

export const handleEvent: bp.EventHandlers['files-readonly:folderDeletedRecursive'] = async (props) => {
  const deletedFolder = props.event.payload.folder

  const integrationAlias = extractIntegrationAlias(props.event.type, props.logger)
  if (!integrationAlias) {
    return
  }

  try {
    const folderPath = deletedFolder.absolutePath?.endsWith('/')
      ? deletedFolder.absolutePath
      : `${deletedFolder.absolutePath}/`

    const filesToDelete: Array<{ id: string }> = []
    let nextToken: string | undefined

    do {
      const response = await props.client.listFiles({
        tags: { integrationAlias },
        nextToken,
      })

      for (const file of response.files) {
        const externalPath = file.tags?.['externalPath']
        if (externalPath && externalPath.startsWith(folderPath)) {
          filesToDelete.push({ id: file.id })
        }
      }

      nextToken = response.meta?.nextToken
    } while (nextToken)

    await Promise.allSettled(filesToDelete.map((file) => props.client.deleteFile({ id: file.id })))
  } catch (error) {
    props.logger.error(`Error deleting files in folder ${deletedFolder.absolutePath}:`, error)
  }
}

import { extractIntegrationAlias } from '../../utils/extract-integration-alias'
import * as bp from '.botpress'

export const handleEvent: bp.EventHandlers['*'] = async (props) => {
  const deletedFolder = (props.event.payload as { folder: any }).folder

  const integrationAlias = extractIntegrationAlias(props.event.type, props.logger)
  if (!integrationAlias) {
    return
  }

  try {
    const { files } = await props.client.listFiles({
      tags: {
        externalParentId: deletedFolder.id,
        integrationName: integrationAlias,
        integrationAlias,
      },
    })

    for (const filesApiFile of files) {
      await props.client.deleteFile({ id: filesApiFile.id })
    }
  } catch (error) {
    props.logger.error(`Error deleting files in folder ${deletedFolder.absolutePath}:`, error)
  }
}

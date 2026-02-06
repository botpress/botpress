import { extractIntegrationAlias } from '../../utils/extract-integration-alias'
import * as bp from '.botpress'

export const handleEvent: bp.EventHandlers['*'] = async (props) => {
  const deletedFile = (props.event.payload as { file: any }).file

  const integrationAlias = extractIntegrationAlias(props.event.type, props.logger)
  if (!integrationAlias) {
    return
  }

  try {
    const { files } = await props.client.listFiles({
      tags: {
        externalId: deletedFile.id,
        integrationName: integrationAlias,
        integrationAlias,
      },
    })

    for (const filesApiFile of files) {
      await props.client.deleteFile({ id: filesApiFile.id })
      props.logger.info(`File ${deletedFile.absolutePath} has been deleted`)
    }
  } catch (error) {
    props.logger.error(`Error deleting file ${deletedFile.absolutePath}:`, error)
  }
}

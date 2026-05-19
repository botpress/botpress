import * as bp from '../../.botpress'
import { GrafanaClient } from '../client'

export const createFolderAction: bp.IntegrationProps['actions']['createFolder'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    const result = await client.createFolder(props.input)
    if (!result.success) props.logger.forBot().error(`Failed to create folder: ${result.error}`)
    return result
  } catch (error_: unknown) {
    const error = error_ instanceof Error ? error_.message : String(error_)
    props.logger.forBot().error(`Failed to create folder: ${error}`)
    return { success: false, error }
  }
}

export const listFoldersAction: bp.IntegrationProps['actions']['listFolders'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    const result = await client.listFolders()
    if (!result.success) props.logger.forBot().error(`Failed to list folders: ${result.error}`)
    return result
  } catch (error_: unknown) {
    const error = error_ instanceof Error ? error_.message : String(error_)
    props.logger.forBot().error(`Failed to list folders: ${error}`)
    return { success: false, error }
  }
}

export const deleteFolderAction: bp.IntegrationProps['actions']['deleteFolder'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    const result = await client.deleteFolder(props.input.folderUid)
    if (!result.success) props.logger.forBot().error(`Failed to delete folder: ${result.error}`)
    return result
  } catch (error_: unknown) {
    const error = error_ instanceof Error ? error_.message : String(error_)
    props.logger.forBot().error(`Failed to delete folder: ${error}`)
    return { success: false, error }
  }
}

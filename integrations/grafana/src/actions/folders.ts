import * as bp from '../../.botpress'
import { createFolder, listFolders, deleteFolder } from '../clients/folders'

export const createFolderAction: bp.IntegrationProps['actions']['createFolder'] = async (props) => {
  const config = props.ctx.configuration
  const result = await createFolder(config, props.input)
  if (!result.success) props.logger.forBot().error(`Failed to create folder: ${result.error}`)
  return result
}

export const listFoldersAction: bp.IntegrationProps['actions']['listFolders'] = async (props) => {
  const config = props.ctx.configuration
  const result = await listFolders(config)
  if (!result.success) props.logger.forBot().error(`Failed to list folders: ${result.error}`)
  return result
}

export const deleteFolderAction: bp.IntegrationProps['actions']['deleteFolder'] = async (props) => {
  const { folderUid, forceDeleteRules } = props.input
  const config = props.ctx.configuration
  const result = await deleteFolder(config, folderUid, forceDeleteRules)
  if (!result.success) props.logger.forBot().error(`Failed to delete folder: ${result.error}`)
  return result
}

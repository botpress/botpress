import * as bp from '../../.botpress'
import { createFolder, listFolders, deleteFolder } from '../clients/folders'
import { getK8sNamespace } from './utils'

export const createFolderAction: bp.IntegrationProps['actions']['createFolder'] = async (props) => {
  const config = props.ctx.configuration
  const ns = await getK8sNamespace(props)
  const result = await createFolder(config, ns, props.input)
  if (!result.success) props.logger.forBot().error(`Failed to create folder: ${result.error}`)
  return result
}

export const listFoldersAction: bp.IntegrationProps['actions']['listFolders'] = async (props) => {
  const config = props.ctx.configuration
  const ns = await getK8sNamespace(props)
  const result = await listFolders(config, ns)
  if (!result.success) props.logger.forBot().error(`Failed to list folders: ${result.error}`)
  return result
}

export const deleteFolderAction: bp.IntegrationProps['actions']['deleteFolder'] = async (props) => {
  const { folderUid } = props.input
  const config = props.ctx.configuration
  const ns = await getK8sNamespace(props)
  const result = await deleteFolder(config, ns, folderUid)
  if (!result.success) props.logger.forBot().error(`Failed to delete folder: ${result.error}`)
  return result
}

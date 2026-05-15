import * as bp from '../../.botpress'
import { createFolder, listFolders, deleteFolder } from '../clients/folders'
import { getK8sNamespace } from './utils'

export const createFolderAction: bp.IntegrationProps['actions']['createFolder'] = async (props) => {
  const nsResult = await getK8sNamespace(props)
  if (!nsResult.success) {
    props.logger.forBot().error(`Failed to load integration state: ${nsResult.error}`)
    return { success: false, error: nsResult.error }
  }
  const result = await createFolder(props.ctx.configuration, nsResult.ns, props.input)
  if (!result.success) props.logger.forBot().error(`Failed to create folder: ${result.error}`)
  return result
}

export const listFoldersAction: bp.IntegrationProps['actions']['listFolders'] = async (props) => {
  const nsResult = await getK8sNamespace(props)
  if (!nsResult.success) {
    props.logger.forBot().error(`Failed to load integration state: ${nsResult.error}`)
    return { success: false, error: nsResult.error }
  }
  const result = await listFolders(props.ctx.configuration, nsResult.ns)
  if (!result.success) props.logger.forBot().error(`Failed to list folders: ${result.error}`)
  return result
}

export const deleteFolderAction: bp.IntegrationProps['actions']['deleteFolder'] = async (props) => {
  const nsResult = await getK8sNamespace(props)
  if (!nsResult.success) {
    props.logger.forBot().error(`Failed to load integration state: ${nsResult.error}`)
    return { success: false, error: nsResult.error }
  }
  const result = await deleteFolder(props.ctx.configuration, nsResult.ns, props.input.folderUid)
  if (!result.success) props.logger.forBot().error(`Failed to delete folder: ${result.error}`)
  return result
}

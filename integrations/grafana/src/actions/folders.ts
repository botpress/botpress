import * as sdk from '@botpress/sdk'
import * as bp from '../../.botpress'
import { GrafanaClient } from '../client'

export const createFolderAction: bp.IntegrationProps['actions']['createFolder'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    return await client.createFolder(props.input)
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

export const listFoldersAction: bp.IntegrationProps['actions']['listFolders'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    return { folders: await client.listFolders() }
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

export const deleteFolderAction: bp.IntegrationProps['actions']['deleteFolder'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    await client.deleteFolder(props.input.folderUid)
    return {}
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

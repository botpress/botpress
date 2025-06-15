import { downloadToBotpress } from 'src/files-api-utils'
import { Client as DriveClient } from '../../client'
import * as bp from '.botpress'

export const filesReadonlyTransferFileToBotpress: bp.IntegrationProps['actions']['filesReadonlyTransferFileToBotpress'] =
  async (props) => {
    const driveClient = await DriveClient.create(props)

    const { botpressFileId } = await downloadToBotpress({
      botpressFileKey: props.input.fileKey,
      googleDriveFileId: props.input.file.id,
      client: props.client,
      driveClient,
      indexFile: props.input.shouldIndex,
    })

    return { botpressFileId }
  }

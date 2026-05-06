import * as sdk from '@botpress/sdk'
import axios, { AxiosError } from 'axios'
import type { Client as DriveClient } from './client'
import * as bp from '.botpress'

const findIndexingPendingFileByKey = async (client: bp.Client, key: string): Promise<string | undefined> => {
  let nextToken: string | undefined
  do {
    const { files, meta } = await client.listFiles({ nextToken })
    const match = files.find((f) => f.key === key && f.status === 'indexing_pending')
    if (match) {
      return match.id
    }
    nextToken = meta.nextToken
  } while (nextToken)
  return undefined
}

export const downloadToBotpress = async ({
  client,
  driveClient,
  botpressFileKey,
  googleDriveFileId,
  indexFile,
}: {
  client: bp.Client
  driveClient: DriveClient
  googleDriveFileId: string
  botpressFileKey: string
  indexFile?: boolean
}) => {
  const indexingPendingFileId = await findIndexingPendingFileByKey(client, botpressFileKey)
  if (indexingPendingFileId) {
    return { botpressFileId: indexingPendingFileId }
  }

  const content = await driveClient.downloadFileData({ id: googleDriveFileId })
  const { mimeType, dataSize, dataType, data } = content
  const uploadParams = {
    key: botpressFileKey,
    contentType: mimeType,
    index: indexFile ?? false,
  }

  let botpressFileId: string
  if (dataType === 'stream') {
    const upsertResponse = await client.upsertFile({
      ...uploadParams,
      size: dataSize,
    })
    botpressFileId = upsertResponse.file.id
    await axios
      .put(upsertResponse.file.uploadUrl, data, {
        maxBodyLength: dataSize,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': dataSize,
        },
      })
      .catch((reason: AxiosError) => {
        throw new sdk.RuntimeError(`Error uploading file stream: ${reason}`)
      })
  } else {
    const uploadResponse = await client.uploadFile({
      ...uploadParams,
      content: data,
    })
    botpressFileId = uploadResponse.file.id
  }

  return { botpressFileId }
}

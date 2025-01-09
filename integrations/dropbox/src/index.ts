import assert from 'assert'
import { Dropbox, DropboxAuth, files } from 'dropbox'
import { handler } from './webhook-events/handler'
import * as bp from '.botpress'

async function createActionPropsAndTools<T extends bp.AnyActionProps>(props: T) {
  const { ctx } = props
  const dbxAuth = new DropboxAuth({
    clientId: ctx.configuration.dropboxAppKey,
    clientSecret: ctx.configuration.dropboxAppSecret,
    accessToken: ctx.configuration.dropboxAccessToken,
  })
  const dbxClient = new Dropbox({ auth: dbxAuth })

  return {
    dbxClient,
    ...props,
  }
}

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    createFile: async (baseProps) => {
      const props = await createActionPropsAndTools(baseProps)
      const res = await props.dbxClient.filesUpload({
        contents: props.input.contents,
        path: props.input.path,
      })
      props.logger.info(`Created file: ${JSON.stringify(res.result)}`)
      return {
        id: res.result.id,
        name: res.result.name,
        path: res.result.path_display!,
        created: res.result.server_modified,
        revision: res.result.rev,
        size: res.result.size,
        fileHash: res.result.content_hash!,
        isDownloadable: res.result.is_downloadable!,
      }
    },
    readItemMetadata: async (baseProps) => {
      const props = await createActionPropsAndTools(baseProps)
      const { dbxClient, input } = props
      const res = await dbxClient.filesGetMetadata({
        path: input.path,
      })
      const entry = res.result
      if (entry['.tag'] === 'deleted') {
        throw new Error('File was deleted')
      }
      const out = dropboxEntryMetadataTransform(entry)
      return { result: out }
    },
    listItemsInFolder: async (baseProps) => {
      const props = await createActionPropsAndTools(baseProps)
      const { input, dbxClient } = props
      let res
      if (input.nextToken) {
        res = await dbxClient.filesListFolderContinue({
          cursor: input.nextToken,
        })
      } else {
        res = await dbxClient.filesListFolder({
          path: input.path,
          recursive: input.recursive,
          limit: input.limit,
          include_deleted: false,
        })
      }
      const entries = res.result.entries
        .filter((entry) => entry['.tag'] !== 'deleted')
        .map(dropboxEntryMetadataTransform)
      return {
        entries,
        nextToken: res.result.cursor,
        hasMore: res.result.has_more,
      }
    },
    deleteFile: async (baseProps) => {
      const props = await createActionPropsAndTools(baseProps)
      const { dbxClient, input } = props
      const res = await dbxClient.filesDeleteV2({ path: input.path })
      const entry = res.result.metadata
      if (entry['.tag'] === 'deleted') {
        throw new Error('File was already deleted')
      }
      const out = dropboxEntryMetadataTransform(entry)
      return { result: out }
    },
    deleteBatch: async (baseProps) => {
      const props = await createActionPropsAndTools(baseProps)
      const { dbxClient, input } = props
      const res = await dbxClient.filesDeleteBatch({
        entries: input.paths.map((path) => ({ path })),
      })
      if (res.result['.tag'] !== 'async_job_id') {
        throw new Error('Unexpected response: ' + JSON.stringify(res.result))
      }
      const jobId = res.result.async_job_id
      let jobStatus = ''
      let jobRes
      let retriesLeft = 3
      while (jobStatus !== 'complete') {
        jobRes = await dbxClient.filesDeleteBatchCheck({
          async_job_id: jobId,
        })
        jobStatus = jobRes.result['.tag']
        if (jobStatus === 'failed') {
          throw new Error('Batch deletion failed')
        }
        if (jobStatus !== 'complete' && retriesLeft-- > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
      if (jobStatus !== 'complete') {
        throw new Error('Batch deletion in progress on dropbox, but timed out waiting for its completion')
      }
      assert(jobRes !== undefined && jobRes.result['.tag'] === 'complete')
      return {
        '.tag': jobRes.result['.tag'],
        entries: jobRes.result.entries.map((entry) => {
          return {
            '.tag': entry['.tag'],
            metadata: entry['.tag'] === 'failure' ? entry.failure : dropboxEntryMetadataTransform(entry.metadata),
          }
        }),
      }
    },
    downloadFile: async (baseProps) => {
      const props = await createActionPropsAndTools(baseProps)
      const { dbxClient, input } = props
      const res = await dbxClient.filesDownload({ path: input.path })
      const { fileBinary } = res.result as any
      const file = await props.client.uploadFile({
        key: res.result.name,
        content: fileBinary,
      })
      return { fileUrl: file.file.url }
    },
    downloadFolder: async (baseProps) => {
      const props = await createActionPropsAndTools(baseProps)
      const { dbxClient, input } = props
      const res = await dbxClient.filesDownloadZip({ path: input.path })
      const { fileBinary } = res.result as any
      const file = await props.client.uploadFile({
        key: res.result.metadata.name,
        content: fileBinary,
      })
      return { zipUrl: file.file.url }
    },
    createFolder: async (baseProps) => {
      const props = await createActionPropsAndTools(baseProps)
      const { dbxClient, input } = props
      const res = await dbxClient.filesCreateFolderV2({ path: input.path })
      const { metadata } = res.result
      return {
        id: metadata.id,
        name: metadata.name,
        path: metadata.path_display!,
      }
    },
    copyItem: async (baseProps) => {
      const props = await createActionPropsAndTools(baseProps)
      const { dbxClient, input } = props
      const res = await dbxClient.filesCopyV2({ from_path: input.fromPath, to_path: input.toPath })
      const out = dropboxEntryMetadataTransform(res.result.metadata)
      return { result: out }
    },
    moveItem: async (baseProps) => {
      const props = await createActionPropsAndTools(baseProps)
      const { dbxClient, input } = props
      const res = await dbxClient.filesMoveV2({ from_path: input.fromPath, to_path: input.toPath })
      const out = dropboxEntryMetadataTransform(res.result.metadata)
      return { result: out }
    },
  },
  channels: {},
  handler,
})
function dropboxEntryMetadataTransform(
  entry: files.FileMetadataReference | files.FolderMetadataReference | files.DeletedMetadataReference
) {
  if (entry['.tag'] === 'deleted') {
    throw new Error('File was deleted')
  }
  let out
  out = {
    '.tag': entry['.tag'],
    id: entry.id,
    name: entry.name,
    path: entry.path_display!,
  }
  if (entry['.tag'] === 'file') {
    out = {
      ...out,
      revision: entry.rev,
      clientModified: entry.client_modified,
      serverModified: entry.server_modified,
      size: entry.size,
      fileHash: entry.content_hash!,
      isDownloadable: entry.is_downloadable!,
    }
  }
  return out
}

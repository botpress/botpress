import assert from 'assert'
import { Dropbox, DropboxAuth, DropboxResponse, files } from 'dropbox'
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
  register: async (props) => {
    const { dbxClient } = await createActionPropsAndTools(props as any as bp.AnyActionProps)
    const test = await dbxClient.checkApp({
      query: 'botpress',
    })
    if (test.status !== 200) {
      throw new Error('Dropbox authentication failed')
    }
  },
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
    deleteItem: async (baseProps) => {
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
      const jobRes = await pollAsyncJob(
        () => dbxClient.filesDeleteBatchCheck({ async_job_id: jobId }),
        'Batch deletion failed'
      )
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
    batchCopyItems: async (baseProps) => {
      const props = await createActionPropsAndTools(baseProps)
      const { dbxClient, input } = props
      const res = await dbxClient.filesCopyBatchV2({
        entries: input.entries.map((item) => ({ from_path: item.fromPath, to_path: item.toPath })),
      })
      if (res.result['.tag'] !== 'async_job_id') {
        throw new Error('Unexpected response: ' + JSON.stringify(res.result))
      }
      const jobId = res.result.async_job_id
      const jobRes = await pollAsyncJob(
        () => dbxClient.filesCopyBatchCheckV2({ async_job_id: jobId }),
        'Batch copy failed'
      )
      assert(jobRes !== undefined && jobRes.result['.tag'] === 'complete')
      return {
        '.tag': jobRes.result['.tag'],
        entries: jobRes.result.entries.map((entry) => {
          return {
            '.tag': entry['.tag'],
            metadata: entry['.tag'] !== 'success' ? entry : dropboxEntryMetadataTransform(entry.success),
          }
        }),
      }
    },
    batchMoveItems: async (baseProps) => {
      const props = await createActionPropsAndTools(baseProps)
      const { dbxClient, input } = props
      const res = await dbxClient.filesMoveBatchV2({
        entries: input.entries.map((item) => ({ from_path: item.fromPath, to_path: item.toPath })),
      })
      if (res.result['.tag'] !== 'async_job_id') {
        throw new Error('Unexpected response: ' + JSON.stringify(res.result))
      }
      const jobId = res.result.async_job_id
      const jobRes = await pollAsyncJob(
        () => dbxClient.filesMoveBatchCheckV2({ async_job_id: jobId }),
        'Batch move failed'
      )
      assert(jobRes !== undefined && jobRes.result['.tag'] === 'complete')
      return {
        '.tag': jobRes.result['.tag'],
        entries: jobRes.result.entries.map((entry) => {
          return {
            '.tag': entry['.tag'],
            metadata: entry['.tag'] !== 'success' ? entry : dropboxEntryMetadataTransform(entry.success),
          }
        }),
      }
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

type BatchResponseStatus = files.RelocationBatchV2JobStatus | files.DeleteBatchJobStatus
async function pollAsyncJob<T extends BatchResponseStatus>(
  checkFn: () => Promise<DropboxResponse<T>>,
  failMessage: string
): Promise<DropboxResponse<T>> {
  let jobRes
  let jobStatus = ''
  let retriesLeft = 3

  while (jobStatus !== 'complete') {
    jobRes = await checkFn()
    jobStatus = jobRes.result['.tag']
    if (jobStatus === 'failed') {
      throw new Error(failMessage)
    }
    if (jobStatus !== 'complete' && retriesLeft-- > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  if (jobStatus !== 'complete') {
    throw new Error('Batch operation in progress on dropbox, but timed out')
  }
  assert(jobRes !== undefined)
  return jobRes
}

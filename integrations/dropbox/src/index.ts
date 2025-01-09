import { Dropbox, DropboxAuth } from 'dropbox'
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
      const out = {
        '.tag': entry['.tag'],
        id: entry.id,
        name: entry.name,
        path: entry.path_display!,
      }
      if (entry['.tag'] === 'folder') {
        return { result: out }
      }
      return {
        result: {
          ...out,
          revision: entry.rev,
          clientModified: entry.client_modified,
          serverModified: entry.server_modified,
          size: entry.size,
          fileHash: entry.content_hash!,
          isDownloadable: entry.is_downloadable!,
        },
      }
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
        .map((entry) => {
          const out = {
            '.tag': 'folder',
            id: entry.id,
            name: entry.name,
            path: entry.path_display!,
          }
          if (entry['.tag'] === 'folder') {
            return out
          }
          return {
            ...out,
            '.tag': 'file',
            revision: entry.rev,
            clientModified: entry.client_modified,
            serverModified: entry.server_modified,
            size: entry.size,
            fileHash: entry.content_hash!,
            isDownloadable: entry.is_downloadable!,
          }
        })
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
  },
  channels: {},
  handler,
})

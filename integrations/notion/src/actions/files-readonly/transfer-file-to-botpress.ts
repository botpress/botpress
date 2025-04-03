import * as sdk from '@botpress/sdk'
import { wrapAction } from '../../action-wrapper'
import * as mapping from '../../files-readonly/mapping'

export const filesReadonlyTransferFileToBotpress = wrapAction(
  { actionName: 'filesReadonlyTransferFileToBotpress', errorMessage: 'Failed to transfer file to Botpress' },
  async ({ notionClient, client }, { file, fileKey }) => {
    if (!file.id.startsWith(mapping.PREFIXES.PAGE)) {
      throw new sdk.RuntimeError(`Invalid fileId: ${file.id}`)
    }

    const fileId = file.id.slice(mapping.PREFIXES.PAGE.length)
    const { markdown } = await notionClient.downloadPageAsMarkdown({ pageId: fileId })

    const { file: uploadedFile } = await client.uploadFile({
      key: fileKey,
      content: markdown,
    })

    return { botpressFileId: uploadedFile.id }
  }
)

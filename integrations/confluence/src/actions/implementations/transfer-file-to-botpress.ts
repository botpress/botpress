import { RuntimeError } from '@botpress/sdk'
import { ConfluenceClient } from 'src/client'
import { debugLog } from 'src/logger'
import * as bp from '.botpress'

export const filesReadonlyTransferFileToBotpress: bp.IntegrationProps['actions']['filesReadonlyTransferFileToBotpress'] =
  async ({ logger, client, ctx, input: { file, fileKey, shouldIndex } }) => {
    debugLog(logger, 'filesReadonlyTransferFileToBotpress', 'Transferring file to botpress')
    const confluenceClient = ConfluenceClient(ctx.configuration)
    const pageContents = await confluenceClient.getPageHtml({ pageId: parseInt(file.id) })

    if (!pageContents) {
      throw new RuntimeError('Page is empty or not found')
    }

    const { file: uploadedFile } = await client.uploadFile({
      key: fileKey,
      content: pageContents,
      contentType: 'text/html',
      index: shouldIndex ?? true,
    })

    return { botpressFileId: uploadedFile.id }
  }

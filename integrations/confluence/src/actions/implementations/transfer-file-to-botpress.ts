import { RuntimeError } from '@botpress/sdk'
import { ConfluenceClient } from 'src/client'
import { debugLog } from 'src/logger'
import { convertAtlassianDocumentToMarkdown } from 'src/parser/confluenceToMarkdown'
import * as bp from '.botpress'

export const filesReadonlyTransferFileToBotpress: bp.IntegrationProps['actions']['filesReadonlyTransferFileToBotpress'] =
  async ({ logger, client, ctx, input: { file, fileKey, shouldIndex } }) => {
    debugLog(logger, 'filesReadonlyTransferFileToBotpress', 'Transferring file to botpress')
    const confluenceClient = ConfluenceClient(ctx.configuration)
    const content = await confluenceClient.getPage({ pageId: parseInt(file.id) })

    if (!content.body?.atlas_doc_format.value) {
      throw new RuntimeError('Content not found')
    }

    const markdown = convertAtlassianDocumentToMarkdown(JSON.parse(content.body.atlas_doc_format.value), logger)

    if (!markdown) {
      throw new RuntimeError('Markdown not found')
    }

    const { file: uploadedFile } = await client.uploadFile({
      key: fileKey,
      content: markdown,
      contentType: 'text/plain',
      index: shouldIndex ?? true,
    })

    return { botpressFileId: uploadedFile.id }
  }

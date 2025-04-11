import * as bp from '.botpress'

import { parseJsonToMarkdown } from 'src/parser/confluenceToMarkdown'
import { ConfluenceClient } from 'src/client'
import { RuntimeError } from '@botpress/sdk'

export const filesReadonlyTransferFileToBotpress: bp.IntegrationProps['actions']['filesReadonlyTransferFileToBotpress'] =
  async ({ logger, client, ctx, input: { file, fileKey } }) => {
    logger.debug('Transferring file to Botpress')
    const confluenceClient = ConfluenceClient(ctx.configuration)
    const content = await confluenceClient.getPage({ pageId: parseInt(file.id) })

    if (!content) {
      throw new RuntimeError('Content not found')
    }

    const markdown = parseJsonToMarkdown(JSON.parse(content.body.atlas_doc_format.value), logger)

    if (!markdown) {
      throw new RuntimeError('Markdown not found')
    }

    const { file: uploadedFile } = await client.uploadFile({
      key: fileKey,
      content: markdown ?? 'No content. There might be in error.',
      contentType: 'text/plain',
      index: true,
    })

    return { botpressFileId: uploadedFile.id }
  }

import { parseJsonToMarkdown } from 'src/parser/confluenceToMarkdown'

import { wrapAction } from '../wrapper'
import { getConfluencePage } from './get-page'

export const filesReadonlyTransferFileToBotpress = wrapAction(
  { actionName: 'filesReadonlyTransferFileToBotpress', errorMessage: 'Failed to transfer file to Botpress' },
  async ({ logger, client }, { file, fileKey }) => {
    logger.debug('Transferring file to Botpress')
    const content = await getConfluencePage(file.id, logger)

    if (!content) {
      logger.error('No content found')
      return
    }

    const markdown = parseJsonToMarkdown(JSON.parse(content.body.atlas_doc_format.value), logger)

    if (!markdown) {
      logger.error('No markdown content found')
      return
    }
    logger.debug(markdown)

    const { file: uploadedFile } = await client.uploadFile({
      key: fileKey,
      content: markdown ?? 'No content. There might be in error.',
      contentType: 'text/plain',
      index: true,
    })

    return { botpressFileId: uploadedFile.id }
  }
)

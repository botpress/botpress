import { ConfluenceClient } from 'src/client'
import { errorLog } from 'src/logger'
import * as bp from '.botpress'

export const writeComment: bp.IntegrationProps['actions']['writeComment'] = async ({ input, logger, ctx }) => {
  if (!input.item.id) {
    errorLog(logger, 'writeComment', 'Page ID is required')
  }

  try {
    const client = ConfluenceClient(ctx.configuration)

    const data = await client.writeFooterComment({
      pageId: input.item.id,
      text: input.item.body?.atlas_doc_format.value ?? '',
    })

    if (!data) {
      errorLog(logger, 'writeComment', `Page with ID ${input.item.id} not found`)
    }

    return data
  } catch (error) {
    errorLog(logger, 'writeComment', 'Error in while fetching confluence page' + error)
    return null
  }
}

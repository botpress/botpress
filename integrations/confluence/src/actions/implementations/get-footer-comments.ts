import { ConfluenceClient } from 'src/client'
import { errorLog } from 'src/logger'
import * as bp from '.botpress'

export const getFooterComments: bp.IntegrationProps['actions']['getFooterComments'] = async ({
  input,
  logger,
  ctx,
}) => {
  if (!input.pageId) {
    errorLog(logger, 'getFooterComments', 'Page ID is required')
  }

  try {
    const client = ConfluenceClient(ctx.configuration)
    const pageData = await client.getFooterComments({ pageId: input.pageId })

    if (!pageData) {
      errorLog(logger, 'getFooterComments', `Page with ID ${input.pageId} not found`)
    }

    return pageData
  } catch (error) {
    errorLog(logger, 'getFooterComments', 'Error in while fetching confluence page' + error)
  }
}

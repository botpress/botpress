import { ConfluenceClient } from 'src/client'
import { errorLog } from 'src/logger'
import * as bp from '.botpress'

export const getPage: bp.IntegrationProps['actions']['getPage'] = async ({ input, logger, ctx }) => {
  const pageId = parseInt(input.id)

  if (!pageId) {
    errorLog(logger, 'getPage', 'Page ID is required')
  }

  try {
    const client = ConfluenceClient(ctx.configuration)
    const pageData = await client.getPage({ pageId })

    if (!pageData) {
      errorLog(logger, 'getPage', `Page with ID ${pageId} not found`)
      logger.error(`Page with ID ${pageId} not found`)
    }

    return pageData
  } catch (error) {
    errorLog(logger, 'getPage', 'Error in while fetching confluence page' + error)
  }
}

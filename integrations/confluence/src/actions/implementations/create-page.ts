import { ConfluenceClient } from 'src/client'
import { debugLog, errorLog } from 'src/logger'
import * as bp from '.botpress'

export const createPage: bp.IntegrationProps['actions']['createPage'] = async ({ input, logger, ctx }) => {
  const pageId = input.item.id

  if (!pageId) {
    debugLog(logger, 'createPage', 'Page ID is required')
  }

  try {
    const client = ConfluenceClient(ctx.configuration)

    const pageData = await client.createPage(input)

    if (!pageData) {
      errorLog(logger, 'createPage', `Page with ID ${pageId} not found`)
    }

    return pageData
  } catch (error) {
    errorLog(logger, 'createPage', 'Error in while fetching confluence page: ' + error)
  }
}

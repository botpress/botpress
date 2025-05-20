import { ConfluenceClient } from 'src/client'
import { errorLog } from 'src/logger'
import * as bp from '.botpress'

export const updatePage: bp.IntegrationProps['actions']['updatePage'] = async ({ input, logger, ctx }) => {
  const pageId = parseInt(input.id)

  if (!pageId) {
    errorLog(logger, 'updatePage', 'Page ID is required')
  }

  try {
    const client = ConfluenceClient(ctx.configuration)

    const pageData = await client.updatePage(input)

    if (!pageData) {
      errorLog(logger, 'updatePage', `Page with ID ${pageId} not found`)
    }

    return pageData
  } catch (error) {
    errorLog(logger, 'updatePage', 'Error in while fetching confluence page: ' + error)
  }
}

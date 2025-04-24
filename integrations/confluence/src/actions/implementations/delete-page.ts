import { ConfluenceClient } from 'src/client'
import { errorLog } from 'src/logger'
import * as bp from '.botpress'

export const deletePage: bp.IntegrationProps['actions']['deletePage'] = async ({ input, logger, ctx }) => {
  const pageId = parseInt(input.id)

  if (!pageId) {
    errorLog(logger, 'deletePage', 'Page ID is required')
  }

  try {
    const client = ConfluenceClient(ctx.configuration)

    const pageData = await client.deletePage(input.id)

    if (!pageData) {
      errorLog(logger, 'deletePage', `Page with ID ${pageId} not found`)
    }

    return pageData
  } catch (error) {
    errorLog(logger, 'deletePage', 'Error in while fetching confluence page: ' + error)
  }
}

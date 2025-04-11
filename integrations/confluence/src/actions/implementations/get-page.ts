// import * as bp from '.botpress'
// import { ConfluenceClient } from 'src/client'

// export const getPage: bp.IntegrationProps['actions']['getPage'] = async ({ input, logger, ctx }) => {
//   const pageId = parseInt(input.pageId)

//   if (!pageId) {
//     logger.error('Page ID is required')
//   }

//   try {
//     const client = ConfluenceClient(ctx.configuration)
//     const pageData = await client.getPage({ pageId })

//     logger.debug('pageData', pageData)

//     if (!pageData) {
//       logger.error(`Page with ID ${pageId} not found`)
//     }

//     return pageData
//   } catch (error) {
//     logger.error('Error in while fetching confluence page', error)
//   }
// }

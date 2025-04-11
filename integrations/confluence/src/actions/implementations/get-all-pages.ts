// import { RuntimeError } from '@botpress/sdk'
// import * as bp from '.botpress'
// import { ConfluenceClient } from 'src/client'

// export const getAllPages: bp.IntegrationProps['actions']['getAllPages'] = async ({ ctx }) => {
//   const client = ConfluenceClient(ctx.configuration)
//   const pageData = await client.getPages()

//   if (!pageData) {
//     throw new RuntimeError('Pages not found')
//   }

//   return pageData
// }

import * as notion from '../notion'
import * as bp from '.botpress'

export const addPageToDb: bp.IntegrationProps['actions']['addPageToDb'] = async ({ ctx, input }) => {
  try {
    const response = await notion.addPageToDb(ctx, input.databaseId, input.pageProperties as any)
    if (response) {
      console.info('Successfully added page to database')
      return {}
    } else {
      return {}
    }
  } catch {
    return {}
  }
}

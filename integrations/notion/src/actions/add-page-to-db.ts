import * as notion from '../notion'
import type { IntegrationProps } from '.botpress'

export const addPageToDb: IntegrationProps['actions']['addPageToDb'] = async ({ ctx, input }) => {
  try {
    const response = await notion.addPageToDb(ctx, input.databaseId, input.pageProperties as any)
    if (response) {
      console.info('Successfully added page to database')
      return {}
    } else {
      return {}
    }
  } catch (error) {
    return {}
  }
}

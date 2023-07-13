import type { IntegrationProps } from '.botpress'
import * as notion from '../notion'

export const addPageToDb: IntegrationProps['actions']['addPageToDb'] = async ({ ctx, input }) => {
    try {
        const response = await notion.addPageToDb(ctx, input.databaseId, input.pageProperties as any)
        if (response) {
            console.info('Successfully added page to database')
            return { success: true, response }
        } else {
            return { success: false }
        }
    } catch (error) {
        return { success: false }
    }

};

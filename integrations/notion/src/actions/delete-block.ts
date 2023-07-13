import type { IntegrationProps } from '.botpress'
import * as notion from '../notion'

export const deleteBlock: IntegrationProps['actions']['deleteBlock'] = async ({ ctx, input }) => {
    try {
        const response = await notion.deleteBlock(ctx, input.blockId)
        if (response) {
            console.info('Successfully deleted the block')
            return { success: true, response }
        } else {
            return { success: false }
        }
    } catch (error) {
        return { success: false }
    }

};

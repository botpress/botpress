import type { IntegrationProps } from '.botpress'
import * as notion from '../notion'

export const addCommentToDiscussion: IntegrationProps['actions']['addCommentToDiscussion'] = async ({ ctx, input }) => {
    try {
        const response = await notion.addCommentToDiscussion(ctx, input.discussionId, input.commentBody)
        if (response) {
            console.info('Successfully added comment to discussion')
            return { success: true, response }
        } else {
            return { success: false }
        }
    } catch (error) {
        return { success: false }
    }
}
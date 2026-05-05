import { RuntimeError } from '@botpress/client'
import { getIssueTags, getLinearClient } from 'src/misc/utils'
import * as bp from '.botpress'

export const getOrCreateIssueConversation: bp.IntegrationProps['actions']['getOrCreateIssueConversation'] = async (
  args
) => {
  const { client, input } = args
  const linearClient = await getLinearClient(args)
  const issue = await linearClient.issue(input.conversation.id).catch((thrown) => {
    const message = thrown instanceof Error ? thrown.message : new Error(thrown).message
    throw new RuntimeError(`Failed to get issue with ID ${input.conversation.id}: ${message}`)
  })

  const { conversation } = await client.getOrCreateConversation({
    channel: 'issue',
    tags: await getIssueTags(issue),
    discriminateByTags: ['id'],
  })

  return {
    conversationId: conversation.id,
  }
}

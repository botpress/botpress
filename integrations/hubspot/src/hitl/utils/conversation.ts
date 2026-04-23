import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'

export const getConversationByExternalIdOrThrow = async (client: bp.Client, externalId: string | number) => {
  const { conversations } = await client.listConversations({
    tags: { id: String(externalId) },
  })

  const conversation = conversations[0]
  if (!conversation) {
    throw new RuntimeError(`No HITL conversation found for external ID ${externalId}`)
  }

  return conversation
}

import { getFreshchatClient } from 'src/client'
import { ActionCreateConversation } from '../schemas'


export const updateConversation: ActionCreateConversation = async ({ ctx, client, input, logger }) => {
  const freshchatClient = getFreshchatClient({ ...ctx.configuration })

  let { freshchatConversationId, status, properties, assignedGroupId, assignedAgentId, channelId } = input

  try {
    properties = JSON.parse(properties)
  } catch (e) {
    properties = {}
  }

  // We need to do this because we can't send null/undefined values from the interface
  const args = Object.assign({},
    { status, properties },
    assignedGroupId?.length && { assigned_group_id: assignedGroupId },
    assignedAgentId?.length && { assigned_agent_id: assignedAgentId },
    channelId?.length && { channel_id: channelId },
  )

  console.log('Will use these data', args)

  const res = await freshchatClient.updateConversation(freshchatConversationId, args)
  console.log({res})
  return res
}

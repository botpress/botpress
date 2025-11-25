import * as bp from '.botpress'

export const handleTimeToLintAll: bp.EventHandlers['timeToLintAll'] = async (props) => {
  const {
    state: {
      payload: { name },
    },
  } = await props.client.getOrSetState({
    id: props.ctx.botId,
    name: 'notificationChannelName',
    payload: {},
    type: 'bot',
  })

  let conversationId = undefined

  if (name) {
    const conversation = await props.client.callAction({
      type: 'slack:startChannelConversation',
      input: {
        channelName: name,
      },
    })
    conversationId = conversation.output.conversationId
  }

  await props.client.getOrCreateWorkflow({
    name: 'lintAll',
    input: {},
    discriminateByStatusGroup: 'active',
    conversationId,
    status: 'pending',
  })
}

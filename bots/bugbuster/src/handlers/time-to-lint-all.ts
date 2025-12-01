import * as bp from '.botpress'

export const handleTimeToLintAll: bp.EventHandlers['timeToLintAll'] = async (props) => {
  const { client, ctx, workflows, logger } = props
  logger.info("'timeToLintAll' event received.")

  const conversationId = await tryGetConversationId(client, ctx.botId)
  await workflows.lintAll.startNewInstance({ input: {}, conversationId })
}

const tryGetConversationId = async (client: bp.Client, botId: string): Promise<string | undefined> => {
  const {
    state: {
      payload: { name },
    },
  } = await client.getOrSetState({
    id: botId,
    name: 'notificationChannelName',
    payload: {},
    type: 'bot',
  })

  if (name) {
    const conversation = await client.callAction({
      type: 'slack:startChannelConversation',
      input: {
        channelName: name,
      },
    })
    return conversation.output.conversationId
  }
  return undefined
}

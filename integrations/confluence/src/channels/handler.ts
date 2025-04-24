import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, client }) => {
  if (!req.body) {
    console.warn('Handler received an empty body')
    return
  }

  const activity: Activity = JSON.parse(req.body)
  console.info(`Handler received event of type ${activity.type}`)

  if (!activity.id) {
    return
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      id: activity.conversation.id,
    },
  })
}

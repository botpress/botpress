import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { getAuthenticatedIntercomClient } from './auth'
import { channels } from './channels'
import { handler } from './handler'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register: async ({ client, ctx }) => {
    const adminId = ctx.configuration.adminId
    await client.updateUser({
      id: ctx.botUserId,
      tags: { id: adminId },
    })
  },
  unregister: async () => {},
  actions: {},
  channels,
  handler,
  createUser: async ({ client, tags, ctx }) => {
    const userId = tags.id
    if (!userId) {
      return
    }

    const intercomClient = await getAuthenticatedIntercomClient(client, ctx)
    const { id, email } = await intercomClient.contacts.find({ id: userId })
    const user = await getOrCreateUserAndUpdate(client, {
      id,
      email,
    })

    return {
      body: JSON.stringify({ user: { id: user.id } }),
      headers: {},
      statusCode: 200,
    }
  },
  createConversation: async ({ client, channel, tags, ctx }) => {
    const conversationId = tags.id
    if (!conversationId) {
      return
    }

    const intercomClient = await getAuthenticatedIntercomClient(client, ctx)
    const chat = await intercomClient.conversations.find({ id: conversationId })

    const { conversation } = await client.getOrCreateConversation({
      channel,
      tags: { id: chat.id },
    })

    return {
      body: JSON.stringify({ conversation: { id: conversation.id } }),
      headers: {},
      statusCode: 200,
    }
  },
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})

const getOrCreateUserAndUpdate = async (client: bp.Client, { id, email }: { id: string; email?: string | null }) => {
  let { user } = await client.getOrCreateUser({
    tags: { id },
  })
  if (email && email !== user.tags.email) {
    const updateResponse = await client.updateUser({
      id: user.id,
      tags: { email },
    })
    user = updateResponse.user
  }
  return user
}

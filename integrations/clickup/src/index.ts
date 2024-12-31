import actions from './actions'
import { channels } from './channels'
import { ClickUpClient } from './client'
import { handler } from './handler'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ ctx, logger, webhookUrl }) => {
    logger.forBot().info('ClickUp integration enabled')
    const clickup = new ClickUpClient(ctx.configuration.apiKey, ctx.configuration.teamId)

    // Fetching the user to make sure we have access to click up before registering the webhook.
    await clickup.getUser()
    await setWebhook(clickup, webhookUrl)
  },
  unregister: async () => {},
  actions,
  channels,
  handler,
})

async function setWebhook(clickup: ClickUpClient, webhookUrl: string) {
  const webhooks = await clickup.listWebhooks()
  const events = ['taskCommentPosted', 'taskCreated', 'taskUpdated', 'taskDeleted']

  for (const webhook of webhooks) {
    if (webhook.endpoint === webhookUrl) {
      await clickup.updateWebhook({
        endpoint: webhookUrl,
        status: 'active',
        webhookId: webhook.id,
        events,
      })
      return
    }
  }
  await clickup.createWebhook({
    endpoint: webhookUrl,
    events,
  })
}

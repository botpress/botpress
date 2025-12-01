import { TriggerRequestBody } from '../../types'
import { getTriggerSubscribers, unsubscribeZapierHook } from '../../utils/state-management'
import { postToZapierWebhook } from '../../utils/zapier-client'
import { wrapAction } from '../action-wrapper'

export const trigger = wrapAction(
  { actionName: 'trigger', errorMessageWhenFailed: 'Failed to trigger Zapier webhook' },
  async ({ ctx, client, logger }, { data, correlationId }) => {
    logger.forBot().info(`Zapier trigger called with payload: ${JSON.stringify({ data, correlationId })}`)

    const subscribers = await getTriggerSubscribers(ctx, client)

    logger.forBot().info(`Notifying ${subscribers.length} Zapier trigger REST hooks`)

    for (const { url: zapierHookUrl } of subscribers) {
      const request: TriggerRequestBody = {
        botId: ctx.botId,
        data,
        correlationId,
      }

      const result = await postToZapierWebhook(zapierHookUrl, request, logger)

      if (result.success) {
        logger.forBot().info(`Successfully notified Zapier trigger REST hook: ${zapierHookUrl}`)
      } else {
        logger.forBot().warn(`Failed to notify Zapier trigger REST hook: ${zapierHookUrl} (Error: ${result.error})`)

        // Zapier REST hooks will send back a HTTP 410 Gone error if the hook is no longer valid.
        if (result.error === 'WEBHOOK_GONE') {
          await unsubscribeZapierHook(zapierHookUrl, ctx, client)
        }
      }
    }

    return {}
  }
)

import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

const NOTIFICATION_PAYLOAD = sdk.z.object({
  verification_token: sdk.z.string(),
})

export const isWebhookVerificationRequest = (props: bp.HandlerProps): boolean =>
  Boolean(
    props.req.method.toUpperCase() === 'POST' &&
      props.req.body?.length &&
      NOTIFICATION_PAYLOAD.safeParse(JSON.parse(props.req.body)).success
  )

export const handleWebhookVerificationRequest: bp.IntegrationProps['handler'] = async (props) => {
  const payload: sdk.z.infer<typeof NOTIFICATION_PAYLOAD> = JSON.parse(props.req.body!)

  if (!payload.verification_token) {
    return
  }

  console.debug('Webhook verification token received', {
    verificationToken: payload.verification_token,
    botId: props.ctx.botId,
    integrationId: props.ctx.integrationId,
    webhookId: props.ctx.webhookId,
  })

  props.logger.forBot().info('Webhook verification token received', { verificationToken: payload.verification_token })
}

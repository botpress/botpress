import { CommonHandlerProps } from '../types'
import { DocusignClient } from '.'

export const constructWebhookBody = (webhookUrl: string, botId: string, additionalProps: object = {}) => {
  return {
    configurationType: 'custom',
    urlToPublishTo: webhookUrl,
    name: `Botpress Integration | Bot ID: ${botId}`,
    allowEnvelopePublish: 'true',
    enableLog: 'true',
    deliveryMode: 'SIM',
    requiresAcknowledgement: 'true',
    signMessageWithX509Certificate: 'true',
    includeTimeZoneInformation: 'true',
    includeHMAC: 'true',
    includeEnvelopeVoidReason: 'false',
    includeSenderAccountasCustomField: 'true',
    integratorManaged: 'true',
    envelopeEvents: ['Sent', 'Delivered', 'Completed', 'Declined', 'Voided'],
    events: ['envelope-resent', 'envelope-reminder-sent'],
    allUsers: 'true',
    eventData: {
      version: 'restv2.1',
      includeData: ['custom_fields'],
    },
    ...additionalProps,
  }
}

export const cleanupWebhooks = async (props: CommonHandlerProps, webhookUrl: string, apiClient?: DocusignClient) => {
  apiClient ??= await DocusignClient.create(props)

  const resp = await apiClient.listWebhooks()
  const webhookDeletionPromises = resp?.reduce((webhookPromises, configuration) => {
    const { urlToPublishTo, connectId } = configuration
    if (!connectId || urlToPublishTo !== webhookUrl) {
      return webhookPromises
    }

    const promise = apiClient.removeWebhook(connectId)
    return webhookPromises.concat(promise)
  }, [] as Promise<boolean>[])

  await Promise.allSettled(webhookDeletionPromises ?? [])
}

export const refreshWebhooks = async (props: CommonHandlerProps, webhookUrl: string, apiClient?: DocusignClient) => {
  apiClient ??= await DocusignClient.create(props)

  await cleanupWebhooks(props, webhookUrl, apiClient)

  await apiClient.createWebhook(webhookUrl, props.ctx.botId)
}

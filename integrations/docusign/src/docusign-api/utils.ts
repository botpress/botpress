import { CommonHandlerProps } from '../types'
import { DocusignClient } from '.'

export const cleanupWebhooks = async (props: CommonHandlerProps, webhookUrl: string, apiClient?: DocusignClient) => {
  apiClient ??= await DocusignClient.create(props)

  const resp = await apiClient.getWebhooksList()
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

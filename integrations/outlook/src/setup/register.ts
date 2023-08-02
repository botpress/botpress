import type { RegisterFunction } from '../misc/types'
import moment from 'moment'

import { getClient } from '../utils'

export const register: RegisterFunction = async ({
  webhookUrl,
  ctx,
  client,
}) => {
  const graphClient = getClient(ctx.configuration)
  const subscriptions = await graphClient.listSubscriptions()

  if (!ctx.configuration.useAsChannel) {
    for (let subscription of subscriptions) {
      if (subscription) {
        await graphClient.unsubscribeWebhook(subscription.id || '')
      }
    }
    return
  }

  console.info('suscribing webhook %s', webhookUrl)

  const existingSubscriptions = subscriptions.filter((subcription) => {
    const match = JSON.stringify(subcription.resource).match(
      /\/users\/(.+)\/mailFolders\('(.+)'\)\/messages/
    )
    const emailAddress = match ? match[1] : null
    const mailFolder = match ? match[2] : null

    return (
      subcription.notificationUrl === webhookUrl &&
      emailAddress === ctx.configuration.emailAddress &&
      mailFolder === ctx.configuration.mailFolder
    )
  })

  let existingSubscription
  for (let i = 0; i < existingSubscriptions.length; i++) {
    const subscription = existingSubscriptions[i]
    if (subscription && i < existingSubscriptions.length - 1) {
      await graphClient.unsubscribeWebhook(subscription.id || '')
    } else {
      existingSubscription = subscription
    }
  }

  let subscriptionId

  if (
    existingSubscription &&
    moment.utc(existingSubscription.expirationDateTime).isAfter(moment.utc())
  ) {
    subscriptionId = existingSubscription.id
    console.info('Using existing subscriptionId ', subscriptionId)
  } else {
    subscriptionId = await graphClient.subscribeWebhook(webhookUrl, ctx)
    console.info('Created new subscriptionId ', subscriptionId)
  }

  client.setState({
    type: 'integration',
    id: ctx.integrationId,
    name: 'subscriptionInfo',
    payload: {
      subscriptionId,
    },
  })
  console.info('subscriptionId ', subscriptionId)
}

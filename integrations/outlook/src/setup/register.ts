import moment from 'moment'
import type { RegisterFunction } from '../misc/types'

import { getClient } from '../utils'

export const register: RegisterFunction = async ({ webhookUrl, ctx, client }) => {
  const graphClient = getClient(ctx.configuration)
  console.info('suscribing webhook %s', webhookUrl)

  const subscriptions = await graphClient.listSubscriptions()

  const existingSubscription = subscriptions.find((subcription) => {
    const match = JSON.stringify(subcription.resource).match(/\/users\/(.+)\/mailFolders\('(.+)'\)\/messages/)
    const emailAddress = match ? match[1] : null
    const mailFolder = match ? match[2] : null

    return (
      subcription.notificationUrl === webhookUrl &&
      emailAddress === ctx.configuration.emailAddress &&
      mailFolder === ctx.configuration.mailFolder
    )
  })

  let subscriptionId

  if (existingSubscription && moment.utc(existingSubscription.expirationDateTime).isAfter(moment.utc())) {
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

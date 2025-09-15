import * as bp from '.botpress'
import { z } from '@botpress/sdk'
import { campaignWebhookSchema, subscriberWebhookSchema, webhookSchema } from 'definitions/schemas'

type Client = bp.Client
type IntegrationLogger = bp.Logger

const subscriberCreated = async({
    payload,
    client,
    logger,
}: {
    payload: z.infer<typeof webhookSchema>,
    client: Client,
    logger: IntegrationLogger,
}) => {
    logger.forBot().debug('Triggering subscriber created event')
    logger.forBot().debug(`Example Payload ${JSON.stringify(payload)}`)

    const subscriber = subscriberWebhookSchema.parse(payload)

    await client.createEvent({
        type: 'subscriberCreated',
        payload: subscriber,
    })
}

const campaignSent = async ({
    payload,
    client,
    logger,
}: {
    payload: z.infer<typeof webhookSchema>,
    client: Client,
    logger: IntegrationLogger,
}) => {
    logger.forBot().debug('Triggering campaign sent event')
    logger.forBot().debug(`Example Payload ${JSON.stringify(payload)}`)

    const campaign = campaignWebhookSchema.parse(payload)

    await client.createEvent({
        type: 'campaignSent',
        payload: campaign,
    })
}

export const events = {
    subscriberCreated,
    campaignSent
}
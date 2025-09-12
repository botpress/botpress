import { getAuthenticatedMailerLiteClient } from "src/utils"
import * as bp from '.botpress'
import { webhookSchema } from '../../definitions/schemas'


export const register: bp.IntegrationProps['register'] = async ({ ctx, client, webhookUrl, logger }) => {
    const mlClient = await getAuthenticatedMailerLiteClient({ ctx, client })

    const params = {
        name: "Subscriber Created",
        events: ["subscriber.created"],
        url: webhookUrl
    };

    let mailerLiteWebhookId
    try{
        const response = await mlClient.webhooks.create(params)
        const validatedData = webhookSchema.parse(response.data.data)
        mailerLiteWebhookId = validatedData.id
        console.log("Webhook created")

    } catch (error) {
        logger.error('Failed to create webhook:', error)
        throw new Error('Webhook setup failed')
    }

    await client.setState({
        type: 'integration',
        id: ctx.integrationId,
        name: 'mailerLiteIntegrationInfo',
        payload: {
            mailerLiteWebhookId,
        },
    })
}
import * as bp from '.botpress'
import { webhookSchema } from '../../definitions/schemas'


export const handler: bp.IntegrationProps['handler'] = async (props) => {
    const { req, logger, client } = props

    // logger.debug(`Received request on ${req.method}: ${JSON.stringify(req.body)}`)

    if (req.method === 'POST' && req.path === ''){
        try {
            const { body } = req
            
            if (!req.body) {
                return
            }

            const mailerLiteEvent = JSON.parse(req.body)
            const parsedData = webhookSchema.safeParse(mailerLiteEvent)           

            await client.createEvent({
                type: 'subscriberCreated',
                payload: parsedData.data
            })

            logger.forBot().debug("Event successfully created")

            return {
                status: 200,
                body: JSON.stringify(parsedData)
            }
        } catch (error) {
            logger.error('Webhook validation failed:', error)
        }
    }
    return
}
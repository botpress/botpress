import { RuntimeError, z } from '@botpress/sdk'
import { subscriberSchema } from 'definitions/schemas'
import { getAuthenticatedMailerLiteClient } from 'src/utils'
import * as bp from '.botpress'

type MailerLiteClient = Awaited<ReturnType<typeof getAuthenticatedMailerLiteClient>>

export const fetchSubscriber: bp.Integration['actions']['fetchSubscriber'] = async ({
    client,
    ctx,
    input,
    logger,
}) => {

    const mlClient: MailerLiteClient = await getAuthenticatedMailerLiteClient({ ctx, client })
    const { id, email } = input
    logger.forBot().debug(`Fetching Subscriber by : id:${id} or email:${email}`)
    
    const searchParam = id ?? email
    if (!searchParam) {
        throw new RuntimeError("Must provide an email or id to search for!")
    }
    const response = await mlClient.subscribers.find(searchParam)
    return subscriberSchema.parse(response.data.data)
}

export const createOrUpsertSubscriber: bp.Integration['actions']['createOrUpsertSubscriber'] = async ({
    client,
    ctx,
    input,
    logger,
}) => {
    const mlClient: MailerLiteClient = await getAuthenticatedMailerLiteClient({ ctx, client })
    const response = await mlClient.subscribers.createOrUpdate(input)

    return subscriberSchema.parse(response.data.data)
}
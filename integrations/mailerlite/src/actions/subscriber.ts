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
    const mlClient = await getAuthenticatedMailerLiteClient({ ctx, client })
    const { id, email } = input

    const searchParam = id ?? email
    if (!searchParam) {
        throw new RuntimeError("Must provide an email or id to search for!")
    }
    const response = await mlClient.subscribers.find(searchParam)
    return subscriberSchema.parse(response.data.data)
}
import { RuntimeError, z } from '@botpress/sdk'
import { groupSchema, groupsResponseSchema, subscriberSchema } from 'definitions/schemas'
import { getAuthenticatedMailerLiteClient } from 'src/utils'
import * as bp from '.botpress'

type MailerLiteClient = Awaited<ReturnType<typeof getAuthenticatedMailerLiteClient>>
type GetGroupsParams = Parameters<MailerLiteClient['groups']['get']>[0]

const isHttpError = (err: unknown): err is { response?: { status?: number } } => {
    if (typeof err !== 'object' || err === null) return false
    if (!('response' in err)) return false
    const response = (err as { response?: unknown }).response
    if (typeof response !== 'object' || response === null) return false
    return 'status' in response && typeof (response as { status?: unknown }).status === 'number'
  }

export const listGroups: bp.Integration['actions']['listGroups'] = async ({
    client,
    ctx,
    input,
    logger,
}) => {
    const mlClient: MailerLiteClient = await getAuthenticatedMailerLiteClient({ ctx, client })
    const { limit, name, sort } = input
    const params: GetGroupsParams = { sort: (sort ?? 'name') as GetGroupsParams['sort'] }
    if (limit !== undefined) params.limit = limit
    if (name !== undefined) params.filter = { ...(params.filter ?? {}), name }

    const response = await mlClient.groups.get(params)
    logger.forBot().debug(`Got groups with filter ${JSON.stringify(response.data)}`)
    const parsed = groupsResponseSchema.parse(response.data)
    return parsed ?? { data: [], links: { first: '', last: '', prev: null, next: null }, meta: { current_page: 1, from: 0, last_page: 1, links: [], path: '', per_page: 0, to: 0, total: 0 } }
}

export const assignToGroup: bp.Integration['actions']['assignToGroup'] = async ({
    client,
    ctx,
    input,
    logger,
}) => {
    const mlClient: MailerLiteClient = await getAuthenticatedMailerLiteClient({ ctx, client })
    const { subscriberId, groupId } = input

    logger.forBot().debug(`Assigning user: ${subscriberId} to group: ${groupId}`)
    try {
        const response = await mlClient.groups.assignSubscriber(subscriberId, groupId)

        if (response.status == 200 || response.status == 201){
            logger.forBot().debug('Assignment created')
            return { 
                success: true,
                message: 'Subscriber has been assigned to group',
                group: groupSchema.parse(response.data.data)
            }
        }
        logger.forBot().debug('response', response)
    } catch (error) {
        if (isHttpError(error) && error.response?.status == 404){
            return { success: false, message: 'Subscriber id or group id can not be found' }
        }
        logger.forBot().debug('error', error)
    }
    throw new RuntimeError('Unexpected outcome')

}
import { RuntimeError, z } from '@botpress/sdk'
import { groupsResponseSchema, subscriberSchema } from 'definitions/schemas'
import { getAuthenticatedMailerLiteClient } from 'src/utils'
import * as bp from '.botpress'

type MailerLiteClient = Awaited<ReturnType<typeof getAuthenticatedMailerLiteClient>>
type GetGroupsParams = Parameters<MailerLiteClient['groups']['get']>[0]

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
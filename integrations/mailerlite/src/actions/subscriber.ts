import { RuntimeError } from '@botpress/sdk'
import { subscriberSchema } from 'definitions/schemas'
import { getRequestPayload } from 'misc/utils/utils'
import { getAuthenticatedMailerLiteClient } from 'src/utils'
import * as bp from '.botpress'

type MailerLiteClient = Awaited<ReturnType<typeof getAuthenticatedMailerLiteClient>>

const isHttpError = (err: unknown): err is { response?: { status?: number } } => {
  if (typeof err !== 'object' || err === null) return false
  if (!('response' in err)) return false
  const response = (err as { response?: unknown }).response
  if (typeof response !== 'object' || response === null) return false
  return 'status' in response && typeof (response as { status?: unknown }).status === 'number'
}

export const fetchSubscriber: bp.Integration['actions']['fetchSubscriber'] = async ({ client, ctx, input, logger }) => {
  const mlClient: MailerLiteClient = await getAuthenticatedMailerLiteClient({ ctx, client })
  const { id, email } = input

  logger.forBot().debug(`Fetching Subscriber by : id:${id} or email:${email}`)

  const searchParam = [id, email].find((v) => typeof v === 'string' && v.trim().length > 0)
  if (!searchParam) {
    throw new RuntimeError('Must provide an email or id to search for!')
  }

  try {
    const response = await mlClient.subscribers.find(searchParam)
    return subscriberSchema.parse(response.data.data)
  } catch (e) {
    throw new RuntimeError('Subscriber not found, try again with a valid email', e instanceof Error ? e : undefined)
  }
}

export const createOrUpsertSubscriber: bp.Integration['actions']['createOrUpsertSubscriber'] = async ({
  client,
  ctx,
  input,
  logger,
}) => {
  const mlClient: MailerLiteClient = await getAuthenticatedMailerLiteClient({ ctx, client })
  const payload = getRequestPayload(input)
  const typedPayload: Parameters<MailerLiteClient['subscribers']['createOrUpdate']>[0] = payload as Parameters<
    MailerLiteClient['subscribers']['createOrUpdate']
  >[0]
  const response = await mlClient.subscribers.createOrUpdate(typedPayload)
  logger.forBot().debug(`Create or updated new user ${JSON.stringify(typedPayload)}`)

  return subscriberSchema.parse(response.data.data)
}

export const deleteSubscriber: bp.Integration['actions']['deleteSubscriber'] = async ({
  client,
  ctx,
  input,
  logger,
}) => {
  const { id } = input
  const mlClient = await getAuthenticatedMailerLiteClient({ ctx, client })

  try {
    const res = await mlClient.subscribers.delete(id)
    if (res.status === 204) {
      logger.forBot().debug('Subscriber deleted successfully')
      return { success: true, message: 'Subscriber deleted' }
    }
    throw new RuntimeError(`Unexpected status: ${res.status}`)
  } catch (error) {
    if (isHttpError(error) && error.response?.status === 404) {
      logger.forBot().debug('Subscriber not found')
      return { success: false, message: 'Subscriber not found' }
    }
    throw error
  }
}

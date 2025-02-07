import sdk from '@botpress/sdk'
import * as crypto from 'crypto'
import { TodoistClient } from '../todoist-api'
import { handleCommentAddedEvent, isCommentAddedEvent } from './handlers/comment-added'
import { oauthCallbackHandler } from './handlers/oauth-callback'
import { handlePriorityChangedEvent, isPriorityChangedEvent } from './handlers/priority-changed'
import { handleTaskCompletedEvent, isTaskCompletedEvent } from './handlers/task-completed'
import { handleTaskCreatedEvent, isTaskCreatedEvent } from './handlers/task-created'
import { eventSchema, Event } from './schemas'
import * as bp from '.botpress'

export type WebhookEventHandler<T extends Event> = (
  props: bp.HandlerProps & { event: T; initiatorUserId: string }
) => Promise<void> | void
type WebhookEventHandlerEntry<T extends Event> = Readonly<[(event: Event) => event is T, WebhookEventHandler<T>]>
const EVENT_HANDLERS: Readonly<WebhookEventHandlerEntry<any>[]> = [
  [isCommentAddedEvent, handleCommentAddedEvent],
  [isTaskCreatedEvent, handleTaskCreatedEvent],
  [isPriorityChangedEvent, handlePriorityChangedEvent],
  [isTaskCompletedEvent, handleTaskCompletedEvent],
] as const

export const handler: bp.IntegrationProps['handler'] = async (props: bp.HandlerProps) => {
  const { logger, req } = props

  if (props.req.path.startsWith('/oauth')) {
    logger.forBot().info('Handling Todoist OAuth callback')
    return await oauthCallbackHandler(props)
  }

  if (!req.body) {
    return
  }

  console.debug(req)

  await _ensureWebhookIsAuthenticated(props)
  await _dispatchEvent(props)
}

const _ensureWebhookIsAuthenticated = async ({ req }: bp.HandlerProps) => {
  // Calculating the checksum is computationally expensive, so we first check
  // whether a specific string (the "shared secret") is present in the query
  // parameters to short-circuit the validation process.

  if (!_isSharedSecretValid(req) || !_isChecksumValid(req)) {
    throw new sdk.RuntimeError('Webhook request is not properly authenticated')
  }
}

const _isSharedSecretValid = (req: sdk.Request) => {
  const searchParams = new URLSearchParams(req.query)
  const sharedSecret = searchParams.get('shared_secret')

  return sharedSecret === bp.secrets.WEBHOOK_SHARED_SECRET
}

const _isChecksumValid = (req: sdk.Request) => {
  const http_headers = new Headers(req.headers as Record<string, string>)
  const todoist_checksum = http_headers.get('X-Todoist-Hmac-SHA256')
  const actual_checksum = _computeRequestChecksum(req)

  return todoist_checksum === actual_checksum
}

const _computeRequestChecksum = (req: sdk.Request) =>
  crypto
    .createHmac('sha256', bp.secrets.CLIENT_SECRET)
    .update(req.body ?? '')
    .digest('base64')

const _dispatchEvent = async (props: bp.HandlerProps) => {
  const event = _getEventData(props)

  if (await _isEventFromBot(props, event)) {
    return
  }

  await _handleEventWithMatchingHandler(props, event)
}

const _isEventFromBot = async (props: bp.HandlerProps, event: Event): Promise<boolean> => {
  const { user: botUser } = await props.client.getUser({ id: props.ctx.botUserId })

  return botUser.id === event.initiator.id
}

const _handleEventWithMatchingHandler = async (props: bp.HandlerProps, event: Event): Promise<void> => {
  const matchingHandler = _findMatchingHandler(props, event)
  if (!matchingHandler) {
    console.warn('Unsupported todoist event', event)
    return
  }

  const initiator = await _getEventInitiator({ client: props.client, event })
  await matchingHandler({ ...props, event, initiatorUserId: initiator.id })
}

const _findMatchingHandler = (props: bp.HandlerProps, event: Event) => {
  for (const [eventGuard, eventHandler] of EVENT_HANDLERS) {
    if (eventGuard(event)) {
      props.logger.forBot().debug(`Event matched with ${eventGuard.name}: firing handler ${eventHandler.name}`)
      return eventHandler
    }
  }

  return null
}

const _getEventData = ({ req }: bp.HandlerProps) => eventSchema.parse(JSON.parse(req.body ?? ''))

const _getEventInitiator = async ({ client, event }: { client: bp.Client; event: Event }) => {
  const { user } = await client.getOrCreateUser({
    name: event.initiator.full_name,
    pictureUrl: event.initiator.image_id
      ? TodoistClient.getUserAvatarUrl({ imageId: event.initiator.image_id })
      : undefined,
    tags: { id: event.initiator.id },
  })

  return user
}

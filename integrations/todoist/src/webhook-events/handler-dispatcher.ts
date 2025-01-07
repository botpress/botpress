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

  if (req.path === '/oauth') {
    logger.forBot().info('Handling Todoist OAuth callback')
    return await oauthCallbackHandler(props)
  }

  if (!req.body) {
    return
  }

  console.debug(req)

  await _dispatchEvent(props)
}

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

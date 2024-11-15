import { oauthCallbackHandler } from './handlers/oauth-callback'
import * as bp from '.botpress'
import { eventSchema } from './schemas'
import { handleCommentAddedEvent, isCommentAddedEvent } from './handlers/comment-added'
import { handleTaskCreatedEvent, isTaskCreatedEvent } from './handlers/task-created'
import { handlePriorityChangedEvent, isPriorityChangedEvent } from './handlers/priority-changed'
import { handleTaskCompletedEvent, isTaskCompletedEvent } from './handlers/task-completed'
import { Event } from './schemas'

type WebhookEventHandlerEntry<T extends Event> = Readonly<
  [(event: Event) => event is T, (todoistEvent: T, props: bp.HandlerProps) => Promise<void> | void]
>
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

  if (!req.body) return

  console.log(req)

  await _dispatchEvent(props)
}

const _dispatchEvent = async (props: bp.HandlerProps) => {
  const event = _getEventData(props)

  for (const [eventGuard, eventHandler] of EVENT_HANDLERS) {
    if (eventGuard(event)) {
      props.logger.forBot().debug(`Event matched with ${eventGuard.name}: firing handler ${eventHandler.name}`)
      return await eventHandler(event, props)
    }
  }

  console.warn('Unsupported todoist event', event)
}

const _getEventData = ({ req }: bp.HandlerProps) => eventSchema.parse(JSON.parse(req.body ?? ''))

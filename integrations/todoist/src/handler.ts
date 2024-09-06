import * as bp from '.botpress'
import { NoteEvent, ItemAddedEvent, ItemCompletedEvent, ItemUpdatedEvent, eventSchema } from './types'
import { Priority } from './client'
import { handleOAuth } from './auth'

const RESPONSE_OK = {
  status: 200,
  body: 'OK',
}

async function handleNoteEvent(event: NoteEvent, { client }: bp.HandlerProps) {
  const conversationId = event.event_data.item_id
  const userId = event.event_data.posted_uid
  const commentId = event.event_data.id
  const { conversation } = await client.getOrCreateConversation({
    channel: 'comments',
    tags: { id: conversationId },
  })

  const { user } = await client.getOrCreateUser({
    tags: { id: userId },
  })

  await client.getOrCreateMessage({
    tags: { 
      id: commentId,
    },
    type: 'text',
    userId: user.id,
    conversationId: conversation.id,
    payload: { 
      text: event.event_data.content,
    },
  })

  return RESPONSE_OK
}

async function handleItemAdded(event: ItemAddedEvent, { client }: bp.HandlerProps) {
  const { conversation } = await client.getOrCreateConversation({
    channel: 'comments',
    tags: { id: event.event_data.id },
  })
  
  await client.createEvent({
    type: 'taskAdded',
    payload: {
      id: event.event_data.id,
      content: event.event_data.content,
      description: event.event_data.description,
      priority: event.event_data.priority,
    },
    conversationId: conversation.id, 
  })

  return RESPONSE_OK
}

async function handleItemUpdated(event: ItemUpdatedEvent, { client }: bp.HandlerProps) {
  const newPriority = event.event_data.priority
  const oldPriority = event.event_data_extra?.old_item.priority

  const { conversation } = await client.getOrCreateConversation({
    channel: 'comments',
    tags: { id: event.event_data.id },
  })

  if (newPriority !== oldPriority) {
    await client.createEvent({
      type: 'taskPriorityChanged',
      payload: {
        id: event.event_data.id,
        newPriority: Priority.fromApi(newPriority).toDisplay(),
        oldPriority: oldPriority ? Priority.fromApi(oldPriority).toDisplay() : undefined,
      },
      conversationId: conversation.id,
    })
  }

  return RESPONSE_OK
}

async function handleItemCompleted(event: ItemCompletedEvent, { client }: bp.HandlerProps) {
  const { conversation } = await client.getOrCreateConversation({
    channel: 'comments',
    tags: { id: event.event_data.id },
  })
  
  await client.createEvent({
    type: 'taskCompleted',
    payload: {
      id: event.event_data.id,
      user_id: event.event_data.user_id,
      content: event.event_data.content,
      description: event.event_data.description,
      priority: event.event_data.priority,
    },
    conversationId: conversation.id, 
  })

  return RESPONSE_OK
}

export const handler: bp.IntegrationProps['handler'] = async (props: bp.HandlerProps) => {
  let { req, logger, ctx, client } = props
  if (req.path.startsWith('/oauth')) {
    let response = RESPONSE_OK
    await handleOAuth(req, client, ctx).catch((err) => {
      logger.forBot().error('Error handling OAuth request: ', err.message)
      response = {
        status: 400,
        body: 'Invalid OAuth request',
      }
    })
    return response
  }

  if (!req.body) {
    logger.forBot().warn('Handler received empty request from Todoist')
    return {
      status: 400,
      body: 'Empty request body',
    }
  }
  logger.forBot().info('Handler received request from Todoist with payload: ', req.body)

  let eventData: any
  try {
    eventData = JSON.parse(req.body)
  } catch (e) {
    logger.forBot().warn('Handler received request from Todoist with invalid JSON: ', req.body)
    return {
      status: 400,
      body: 'Invalid JSON',
    }
  }

  const parseResult = eventSchema.safeParse(eventData)
  if (!parseResult.success) {
    logger
      .forBot()
      .warn('Handler received request from Todoist with unsuported payload: ', eventData, 'Error: ', parseResult.error)
    return {
      status: 400,
      body: 'Invalid event',
    }
  }

  const { data: event } = parseResult

  logger.forBot().info(`Received event: ${event.event_name}`)

  if (event.event_name === 'note:added') {
    return handleNoteEvent(event, props)
  }

  if (event.event_name === 'item:added') {
    return handleItemAdded(event, props)
  }

  if (event.event_name === 'item:updated') {
    return handleItemUpdated(event, props)
  }

  if (event.event_name === 'item:completed') {
    return handleItemCompleted(event, props)
  }

  return {
    status: 400,
    body: 'Unsupported event type',
  }
}

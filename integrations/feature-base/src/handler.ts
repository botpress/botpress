import { z } from '@botpress/sdk'
import { commentCreated } from 'definitions/channels/comments'
import { postCreated, postUpdated, postDeleted, postVoted } from 'definitions/events/posts'
import { handleIncomingTextMessage } from './channels'
import * as bp from '.botpress'

const webhookRequestSchema = z.union([
  postCreated.schema,
  postUpdated.schema,
  postDeleted.schema,
  postVoted.schema,
  commentCreated.schema,
])

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  if (!props.req.body) {
    props.logger.error('Handler received an empty body')
    return
  }

  let json: unknown | null = null
  try {
    json = JSON.parse(props.req.body)
  } catch {
    props.logger.error('Failed to parse request body as JSON')
    return
  }

  const { success, error, data: webhookRequestPayload } = webhookRequestSchema.safeParse(json)
  if (!success) {
    props.logger.error(`Failed to validate request body: ${error.message}`)
    return
  }
  switch (webhookRequestPayload.topic) {
    case 'post.created':
      props.client.createEvent({ type: 'postCreated', payload: webhookRequestPayload })
      break
    case 'post.updated':
      props.client.createEvent({ type: 'postUpdated', payload: webhookRequestPayload })
      break
    case 'post.deleted':
      props.client.createEvent({ type: 'postDeleted', payload: webhookRequestPayload })
      break
    case 'post.voted':
      props.client.createEvent({ type: 'postVoted', payload: webhookRequestPayload })
      break
    case 'comment.created':
      await handleIncomingTextMessage(props, webhookRequestPayload)
      break
    default:
      break
  }
}

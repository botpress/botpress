import { z } from '@botpress/sdk'
import { commentCreatedSchema } from 'definitions/channels/comments'
import { postCreated, postUpdated, postDeleted, postVoted } from 'definitions/events/posts'
import { handleIncomingTextMessage } from './channels'
import * as bp from '.botpress'

const webhookRequestSchema = z.union([
  postCreated.schema,
  postUpdated.schema,
  postDeleted.schema,
  postVoted.schema,
  commentCreatedSchema,
])

const webhookTopicSchema = z.object({
  topic: z.string(),
})

const isHandeledTopic = (request: z.infer<typeof webhookTopicSchema>) => {
  const topics: string[] = webhookRequestSchema.options.map((option) => option.shape.topic.value)
  return topics.includes(request.topic)
}

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

  const topicResult = webhookTopicSchema.safeParse(json)

  if (!topicResult.success) {
    props.logger.error(`Failed to validate request body: ${topicResult.error.message}`)
    return
  }

  // We check that the request is actually a topic that can be handle by the handler. This prevent
  // from throwing an error because we are not able to parse the payload.
  if (!isHandeledTopic(topicResult.data)) {
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

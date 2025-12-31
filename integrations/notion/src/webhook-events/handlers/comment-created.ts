import { events } from 'definitions/events'
import * as bp from '.botpress'

const commentCreatedPayloadSchema = events.commentCreated.schema

export const isCommentCreatedEvent = (props: bp.HandlerProps): boolean =>
  Boolean(
    props.req.method.toUpperCase() === 'POST' &&
      props.req.body?.length &&
      commentCreatedPayloadSchema.safeParse(JSON.parse(props.req.body)).success
  )

export const handleCommentCreatedEvent: bp.IntegrationProps['handler'] = async (props) => {
  const { logger, client, req } = props

  const payload = commentCreatedPayloadSchema.parse(JSON.parse(req.body!))
  logger.forBot().debug('Creating comment created event: ' + JSON.stringify(payload))

  try {
    await client.createEvent({
      type: 'commentCreated',
      payload,
    })
    logger.forBot().debug('Successfully created comment created event')
  } catch (error) {
    logger.forBot().error('Failed to create comment event: ' + (error instanceof Error ? error.message : String(error)))
    throw error
  }
}

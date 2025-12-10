import * as bp from '.botpress'
import { events } from 'definitions/events'

const commentCreatedPayloadSchema = events.commentCreated.schema

export const isCommentCreatedEvent = (props: bp.HandlerProps): boolean =>
  Boolean(
    props.req.method.toUpperCase() === 'POST' &&
      props.req.body?.length &&
      commentCreatedPayloadSchema.safeParse(JSON.parse(props.req.body)).success
  )

export const handleCommentCreatedEvent: bp.IntegrationProps['handler'] = async (props) => {
  const payload = commentCreatedPayloadSchema.parse(JSON.parse(props.req.body!))

  await props.client.createEvent({
    type: 'commentCreated',
    payload: {
      ...payload,
    },
  })
}

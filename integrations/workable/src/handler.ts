import { z } from '@botpress/sdk'
import { toCandidateCreatedEventModel, toCandidateMovedEventModel } from './mapping/candidate-mapper'
import { webhookRequestSchema } from './workable-schemas/events'
import * as bp from '.botpress'

const isEventTypeHandled = (request: z.infer<typeof webhookRequestSchema>) => {
  const topics: string[] = webhookRequestSchema.options.map((option) => option.shape.event_type.value)
  return topics.includes(request.event_type)
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

  const webhookInfoResult = webhookRequestSchema.safeParse(json)

  if (!webhookInfoResult.success) {
    props.logger.error(`Failed to validate request body: ${webhookInfoResult.error.message}`)
    return
  }

  if (!isEventTypeHandled(webhookInfoResult.data)) {
    props.logger.forBot().info(`Event ${webhookInfoResult.data} filtered out`)
    return
  }

  const { success, error, data: webhookRequestPayload } = webhookRequestSchema.safeParse(json)

  if (!success) {
    props.logger.error(`Failed to validate request body: ${error.message}`)
    return
  }

  switch (webhookRequestPayload.event_type) {
    case 'candidate_created':
      await props.client.createEvent({
        type: 'candidateCreated',
        payload: toCandidateCreatedEventModel(webhookRequestPayload),
      })
      break
    case 'candidate_moved':
      await props.client.createEvent({
        type: 'candidateMoved',
        payload: toCandidateMovedEventModel(webhookRequestPayload),
      })
      break
    default:
      break
  }
}

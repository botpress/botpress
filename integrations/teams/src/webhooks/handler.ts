import { Activity } from 'botbuilder'
import { processInboundChannelMessage } from '../channels/inbound'
import { teamsActivitySchema } from '../schemas'
import { authorizeRequest } from './signature'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req } = props
  await authorizeRequest(req)

  if (!req.body) {
    props.logger.forBot().warn('Handler received an empty body')
    return
  }

  const parsedBody: Object = JSON.parse(req.body)
  const result = teamsActivitySchema.safeParse(parsedBody)
  if (!result.success) {
    props.logger.forBot().error('Invalid activity payload received:', result.error.format())
    return
  }

  const activity = result.data as unknown as Activity
  props.logger.forBot().info(`Handler received event of type ${activity.type}`)
  await processInboundChannelMessage(props, activity)
}

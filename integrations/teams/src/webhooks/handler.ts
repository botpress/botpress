import { Activity } from 'botbuilder'
import { processInboundChannelMessage } from '../channels/inbound'
import { teamsActivitySchema } from '../schemas'
import { authorizeRequest } from './signature'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req } = props
  await authorizeRequest(req)

  if (!req.body) {
    console.warn('Handler received an empty body')
    return
  }

  const parsedBody: Object = JSON.parse(req.body)
  const result = teamsActivitySchema.safeParse(parsedBody)
  if (!result.success) {
    console.error('Invalid activity payload received:', result.error.format())
    return
  }

  const activity = result.data as unknown as Activity
  console.info(`Handler received event of type ${activity.type}`)
  await processInboundChannelMessage(props, activity)
}

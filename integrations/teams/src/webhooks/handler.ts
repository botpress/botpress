import { Activity } from 'botbuilder'
import { processInboundChannelMessage } from '../channels/inbound'
import { authorizeRequest } from './signature'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req } = props
  await authorizeRequest(req)

  if (!req.body) {
    console.warn('Handler received an empty body')
    return
  }

  const activity: Activity = JSON.parse(req.body)
  console.info(`Handler received event of type ${activity.type}`)

  if (!activity.id) {
    return
  }

  await processInboundChannelMessage(props, activity)
}

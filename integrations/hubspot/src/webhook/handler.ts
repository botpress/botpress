import { oauthCallbackHandler } from './handlers/oauth'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, logger } = props

  logger.debug(`Received request on ${req.path}: ${JSON.stringify(req.body, null, 2)}`)
  if (req.path.startsWith('/oauth')) {
    return await oauthCallbackHandler(props)
  }
}

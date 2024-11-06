import { oauthCallbackHandler } from './handlers/oauth-callback'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ client, ctx, logger, req }) => {
  if (req.path === '/oauth') {
    logger.forBot().info('Handling Google Sheets OAuth callback')
    await oauthCallbackHandler({ client, ctx, req, logger })
  } else {
    logger.forBot().debug('Received unsupported webhook event', { path: req.path, query: req.query })
  }
}

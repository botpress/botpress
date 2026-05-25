import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { handler as wizardHandler } from '../wizard'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, logger } = props

  if (oauthWizard.isOAuthWizardUrl(req.path)) {
    logger.forBot().info('Handling Google Calendar OAuth wizard')
    return await wizardHandler(props)
  }

  logger.forBot().debug('Received unsupported webhook event', { path: req.path, query: req.query })
  return
}

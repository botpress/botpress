import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { handleOAuthWizard } from './handlers/oauth-wizard'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, logger } = props

  if (oauthWizard.isOAuthWizardUrl(req.path)) {
    logger.forBot().info('Handling Google Sheets OAuth wizard')
    return await handleOAuthWizard(props)
  }

  logger.forBot().debug('Received unsupported webhook event', { path: req.path, query: req.query })
  return
}

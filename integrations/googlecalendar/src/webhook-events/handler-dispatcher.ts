import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { handler as wizardHandler } from '../wizard'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, logger } = props

  if (oauthWizard.isOAuthWizardUrl(req.path)) {
    logger.forBot().info('Handling Google Calendar OAuth wizard')
    try {
      return await wizardHandler(props)
    } catch (thrown: unknown) {
      const errorMessage = 'OAuth error: ' + (thrown instanceof Error ? thrown.message : String(thrown))
      logger.forBot().error(errorMessage)
      return oauthWizard.generateRedirection(oauthWizard.getInterstitialUrl(false, errorMessage))
    }
  }

  logger.forBot().debug('Received unsupported webhook event', { path: req.path, query: req.query })
  return
}

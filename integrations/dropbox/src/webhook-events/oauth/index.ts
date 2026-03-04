import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { isOAuthWizardUrl, getInterstitialUrl } from '@botpress/common/src/oauth-wizard'
import * as wizard from './wizard'
import * as bp from '.botpress'

export const oauthCallbackHandler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, logger } = props
  if (!isOAuthWizardUrl(req.path)) {
    return {
      status: 404,
      body: 'Invalid OAuth endpoint',
    }
  }

  try {
    return await wizard.handler(props)
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : Error(String(thrown))
    const errorMessage = 'OAuth registration Error: ' + error.message
    logger.forBot().error(errorMessage)
    return generateRedirection(getInterstitialUrl(false, errorMessage))
  }
}

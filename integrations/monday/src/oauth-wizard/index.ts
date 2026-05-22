import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { getInterstitialUrl, isOAuthWizardUrl } from '@botpress/common/src/oauth-wizard'
import * as wizard from './wizard'
import * as bp from '.botpress'

export const oauthWizardHandler: bp.IntegrationProps['handler'] = async (props) => {
  try {
    const { req, logger } = props

    if (!isOAuthWizardUrl(req.path)) {
      return { status: 404, body: 'Invalid OAuth wizard endpoint' }
    }

    return await wizard.handler(props)
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    props.logger.forBot().error(`OAuth wizard error: ${error.message}`)
    return generateRedirection(getInterstitialUrl(false, error.message))
  }
}

import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { isOAuthWizardUrl, getInterstitialUrl } from '@botpress/common/src/oauth-wizard'
import * as appManifestWizard from './appManifestWizard'
import * as refreshTokenWizard from './refreshTokenWizard'
import * as bp from '.botpress'

export const oauthWizardHandler: bp.IntegrationProps['handler'] = async (props) => {
  const { ctx, req, logger } = props

  if (!isOAuthWizardUrl(req.path)) {
    return {
      status: 404,
      body: 'Invalid OAuth wizard endpoint',
    }
  }

  try {
    logger.forBot().debug('Init oauth wizard for ', ctx.configurationType)
    if (ctx.configurationType === 'refreshToken') {
      return await refreshTokenWizard.handler(props)
    } else {
      return await appManifestWizard.handler(props)
    }
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : Error(String(thrown))
    const errorMessage = 'OAuth wizard error: ' + error.message
    logger.forBot().error(errorMessage)
    return generateRedirection(getInterstitialUrl(false, errorMessage))
  }
}

import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { isOAuthWizardUrl, getInterstitialUrl } from '@botpress/common/src/oauth-wizard'
import * as appManifestWizard from './appManifestWizard'
import * as defaultConfigWizard from './defaultConfigWizard'
import * as manualConfigWizard from './manualConfigWizard'
import * as bp from '.botpress'

export const oauthWizardHandler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, ctx, logger } = props

  if (!isOAuthWizardUrl(req.path)) {
    return {
      status: 404,
      body: 'Invalid OAuth wizard endpoint',
    }
  }

  try {
    if (ctx.configurationType === 'refreshToken') {
      return await manualConfigWizard.handler(props)
    } else if (ctx.configurationType === 'manifestAppCredentials') {
      return await appManifestWizard.handler(props)
    } else {
      return await defaultConfigWizard.handler(props)
    }
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : Error(String(thrown))
    const errorMessage = 'OAuth wizard error: ' + error.message
    logger.forBot().error(errorMessage)
    return generateRedirection(getInterstitialUrl(false, errorMessage))
  }
}

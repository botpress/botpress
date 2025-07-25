import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { isOAuthWizardUrl, getInterstitialUrl } from '@botpress/common/src/oauth-wizard'
import { getErrorFromUnknown } from '../../../misc/utils'
import * as wizard from './wizard'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, client, ctx, logger }) => {
  if (!isOAuthWizardUrl(req.path)) {
    return {
      status: 404,
      body: 'Invalid OAuth endpoint',
    }
  }

  try {
    return await wizard.handler({ req, client, ctx, logger })
  } catch (error) {
    const errorMessage = 'OAuth registration error: ' + getErrorFromUnknown(error).message
    logger.forBot().error(errorMessage)
    return generateRedirection(getInterstitialUrl(false, errorMessage))
  }
}

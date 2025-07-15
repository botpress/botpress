import { generateRedirection } from '@botpress/common/src/html-dialogs'
import { isOAuthWizardUrl, getInterstitialUrl } from '@botpress/common/src/oauth-wizard'
import wizard from './wizard'
import * as bp from '.botpress'

const handler: bp.IntegrationProps['handler'] = async ({ req, client, ctx, logger }) => {
  logger.debug('OAuth handler received request:', JSON.stringify(req))
  if (!isOAuthWizardUrl(req.path)) {
    return {
      status: 404,
      body: 'Invalid OAuth endpoint',
    }
  }

  try {
    return await wizard.handler({ req, client, ctx, logger })
  } catch (err: any) {
    const errorMessage = 'OAuth registration error: ' + err.message
    logger.forBot().error(errorMessage)
    return generateRedirection(getInterstitialUrl(false, errorMessage))
  }
}

export default {
  handler,
}

import { Response } from '@botpress/sdk'
import { getSubpath } from 'src/misc/util'
import { getInterstitialUrl, redirectTo } from 'src/webhook/handlers/oauth/html-utils'
import { handleWizard } from './wizard'
import * as bp from '.botpress'

export const oauthCallbackHandler = async (props: bp.HandlerProps): Promise<Response> => {
  const { req, logger } = props
  let response: Response
  const oauthSubpath = getSubpath(req.path)
  try {
    if (oauthSubpath?.startsWith('/wizard')) {
      response = await handleWizard({ ...props, wizardPath: oauthSubpath })
    } else {
      response = {
        status: 404,
        body: 'Invalid OAuth endpoint',
      }
    }
  } catch (err: any) {
    const errorMessage = '(OAuth registration) Error: ' + err.message
    logger.forBot().error(errorMessage)
    response = redirectTo(getInterstitialUrl(false, errorMessage))
  }
  return response
}

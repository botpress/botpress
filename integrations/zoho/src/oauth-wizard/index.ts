import { getInterstitialUrl, generateRedirection } from '@botpress/common/src/oauth-wizard'
import * as wizard from './wizard'
import * as bp from '.botpress'

export const oauthWizardHandler: bp.IntegrationProps['handler'] = async (props) => {
  const { logger } = props

  try {
    return await wizard.handler(props)
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : Error(String(thrown))
    const message = `OAuth wizard error: ${error.message}`
    logger.forBot().error(message)
    return generateRedirection(getInterstitialUrl(false, message))
  }
}

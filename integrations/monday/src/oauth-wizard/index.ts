import { htmlDialogs, oauthWizard } from '@botpress/common'
import * as wizard from './wizard'
import * as bp from '.botpress'

export const oauthWizardHandler: bp.IntegrationProps['handler'] = async (props) => {
  const { logger } = props
  try {
    return await wizard.handler(props)
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    logger.forBot().error(`OAuth wizard error: ${error.message}`)
    return htmlDialogs.generateRedirection(oauthWizard.getInterstitialUrl(false, error.message))
  }
}

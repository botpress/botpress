import { isOAuthWizardUrl } from '@botpress/common/src/oauth-wizard'

import type { Handler } from '../misc/types'
import { oauthWizardHandler } from '../oauth-wizard'

export const handler: Handler = async (props) => {
  if (isOAuthWizardUrl(props.req.path)) {
    return await oauthWizardHandler(props)
  }
  return
}

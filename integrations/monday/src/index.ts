import { isOAuthWizardUrl } from '@botpress/common/src/oauth-wizard'
import { RuntimeError, isApiError } from '@botpress/sdk'
import * as actions from 'src/actions'
import { oauthWizardHandler } from './oauth-wizard'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ client, ctx }) => {
    const accessToken = (await _getOAuthAccessToken({ client, ctx })) ?? ctx.configuration.personalAccessToken

    if (!accessToken) {
      throw new RuntimeError(
        'Monday credentials are missing. Please connect your Monday account or provide a personal access token.'
      )
    }

    await client.configureIntegration({
      identifier: ctx.webhookId,
    })
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async (props) => {
    if (isOAuthWizardUrl(props.req.path)) {
      return await oauthWizardHandler(props)
    }

    return
  },
})

const _getOAuthAccessToken = async ({ client, ctx }: { client: bp.Client; ctx: bp.Context }) => {
  const { state } = await client
    .getState({
      type: 'integration',
      name: 'oAuthCredentials',
      id: ctx.integrationId,
    })
    .catch((thrown: unknown) => {
      if (isApiError(thrown) && thrown.code === 404) {
        return { state: undefined }
      }

      throw thrown
    })

  return state?.payload.accessToken
}

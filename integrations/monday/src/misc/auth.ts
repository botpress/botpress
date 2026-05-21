import { RuntimeError, isApiError } from '@botpress/sdk'
import * as bp from '.botpress'

type AuthProps = {
  client: bp.Client
  ctx: bp.Context
}

export const getConfigurationAccessToken = async ({ client, ctx }: AuthProps) => {
  const { state } = await client
    .getState({
      type: 'integration',
      name: 'configuration',
      id: ctx.integrationId,
    })
    .catch((thrown: unknown) => {
      if (isApiError(thrown) && thrown.code === 404) {
        return { state: undefined }
      }

      throw thrown
    })

  return state?.payload.personalAccessToken
}

export const getOAuthAccessToken = async ({ client, ctx }: AuthProps) => {
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

  return state?.payload.accessToken || undefined
}

export const getAccessToken = async (props: AuthProps) => {
  const accessToken =
    (await getOAuthAccessToken(props)) ??
    (await getConfigurationAccessToken(props)) ??
    props.ctx.configuration.personalAccessToken

  if (!accessToken) {
    throw new RuntimeError(
      'Monday credentials are missing. Please connect your Monday account or provide a personal access token.'
    )
  }

  return accessToken
}

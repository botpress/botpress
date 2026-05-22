import { RuntimeError, isApiError } from '@botpress/sdk'
import { MondayClient } from './monday-client'
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

export const getMondayClient = async (props: AuthProps) => {
  if (props.ctx.configurationType === 'manual') {
    const { personalAccessToken } = props.ctx.configuration

    if (!personalAccessToken) {
      throw new RuntimeError('Monday credentials are missing. Please provide a personal access token.')
    }

    return createPersonalAccessTokenMondayClient(personalAccessToken)
  }

  const oAuthAccessToken = await getOAuthAccessToken(props)
  if (oAuthAccessToken) {
    return createOAuthMondayClient(oAuthAccessToken)
  }

  const accessToken = await getConfigurationAccessToken(props)

  if (!accessToken) {
    throw new RuntimeError(
      'Monday credentials are missing. Please connect your Monday account or provide a personal access token.'
    )
  }

  return createPersonalAccessTokenMondayClient(accessToken)
}

export const createOAuthMondayClient = (accessToken: string) =>
  MondayClient.create({ authorization: `Bearer ${accessToken}` })

export const createPersonalAccessTokenMondayClient = (accessToken: string) =>
  MondayClient.create({ authorization: accessToken })

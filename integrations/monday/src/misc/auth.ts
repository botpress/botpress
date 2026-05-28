import { RuntimeError, isApiError } from '@botpress/sdk'
import { MondayClient } from './monday-client'
import * as bp from '.botpress'

type AuthProps = {
  client: bp.Client
  ctx: bp.Context
}

export const getOAuthAccessToken = async ({ client, ctx }: AuthProps) => {
  try {
    const { state } = await client.getState({
      type: 'integration',
      name: 'oAuthCredentials',
      id: ctx.integrationId,
    })

    return state?.payload.accessToken || undefined
  } catch (thrown) {
    if (isApiError(thrown) && thrown.code === 404) {
      return undefined
    }

    throw thrown
  }
}

export const getMondayClient = async (props: AuthProps) => {
  if (props.ctx.configurationType === 'manual') {
    const { personalAccessToken } = props.ctx.configuration

    if (!personalAccessToken) {
      throw new RuntimeError('Monday credentials are missing. Please provide a personal access token.')
    }

    return MondayClient.create({ authorization: personalAccessToken })
  }

  let oAuthAccessToken: string | undefined
  try {
    oAuthAccessToken = await getOAuthAccessToken(props)
  } catch (thrown) {
    const message = thrown instanceof Error ? thrown.message : String(thrown)
    throw new RuntimeError(`Failed to load Monday OAuth credentials. Please reconnect your account. (${message})`)
  }

  if (!oAuthAccessToken) {
    throw new RuntimeError(
      'Monday credentials are missing. Please connect your Monday account or provide a personal access token.'
    )
  }

  return createOAuthMondayClient(oAuthAccessToken)
}

export const createOAuthMondayClient = (accessToken: string) =>
  MondayClient.create({ authorization: `Bearer ${accessToken}` })

import { RuntimeError } from '@botpress/sdk'
import { CommonHandlerProps } from '../types'
import { DocusignAuthClient } from './auth'
import { GetAccessTokenResp, UserAccount } from './schemas'
import * as bp from '.botpress'

export const MS_PER_MINUTE = 60000
export const MS_PER_HOUR = MS_PER_MINUTE * 60

export const applyOAuthState = async ({ client, ctx }: CommonHandlerProps, tokenResp: GetAccessTokenResp) => {
  const { accessToken, refreshToken, expiresAt, tokenType } = tokenResp

  const { state } = await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: {
      oauth: {
        accessToken,
        tokenType,
        refreshToken,
        expiresAt,
      },
    },
  })

  if (!state.payload.oauth) {
    throw new Error('Failed to store OAuth state')
  }

  return state.payload.oauth
}

const OAUTH_TIMEOUT_BUFFER = MS_PER_MINUTE * 5
export const getOAuthState = async (props: CommonHandlerProps, authClient?: DocusignAuthClient) => {
  const { state } = await props.client.getOrSetState({
    type: 'integration',
    name: 'configuration',
    id: props.ctx.integrationId,
    payload: {
      oauth: null,
    },
  })
  let oauthState = state.payload.oauth

  if (!oauthState) {
    throw new RuntimeError('User authentication has not been completed')
  }

  const { expiresAt, refreshToken } = oauthState
  if (expiresAt - OAUTH_TIMEOUT_BUFFER <= Date.now()) {
    authClient ??= new DocusignAuthClient()
    const tokenResp = await authClient.getAccessTokenWithRefreshToken(refreshToken)
    if (!tokenResp.success) throw tokenResp.error

    oauthState = await applyOAuthState(props, tokenResp.data)
  }

  return oauthState
}

const _findAccount = (accountsList: UserAccount[], explicitAccountId: string | undefined): UserAccount => {
  let account: UserAccount | null = null

  if (explicitAccountId) {
    account = accountsList.find(({ account_id }) => account_id === explicitAccountId) ?? null

    if (!account) {
      throw new RuntimeError('An account with the specified API Account ID does not exist or is not owned by this user')
    }
  } else {
    account = accountsList.find(({ is_default }: UserAccount) => is_default) ?? accountsList[0]!
  }

  return account
}

const ACCOUNT_REFRESH_AFTER = MS_PER_HOUR * 24
export const refreshAccountState = async (props: CommonHandlerProps) => {
  const authClient = new DocusignAuthClient()

  const { accessToken, tokenType } = await getOAuthState(props, authClient)

  const userInfoResp = await authClient.getUserInfo(accessToken, tokenType)
  if (!userInfoResp.success) throw userInfoResp.error

  const { client, ctx } = props
  const { accounts } = userInfoResp.data

  const explicitAccountId = ctx.configuration.accountId
  const account = _findAccount(accounts, explicitAccountId)

  const refreshAt = !explicitAccountId?.trim() ? Date.now() + ACCOUNT_REFRESH_AFTER : null
  const { state } = await client.setState({
    type: 'integration',
    name: 'account',
    id: ctx.integrationId,
    payload: {
      account: {
        id: account.account_id,
        baseUri: account.base_uri,
        refreshAt,
      },
    },
  })

  if (!state.payload.account) {
    throw new RuntimeError('Failed to store account state')
  }

  return state.payload.account
}

export const getAccountState = async (props: CommonHandlerProps) => {
  const { state } = await props.client.getOrSetState({
    type: 'integration',
    name: 'account',
    id: props.ctx.integrationId,
    payload: {
      account: null,
    },
  })

  let hasAccountChanged = false
  let accountState = state.payload.account
  if (!accountState || (accountState.refreshAt && accountState.refreshAt <= Date.now())) {
    const prevAccountState = accountState
    accountState = await refreshAccountState(props)

    if (accountState.id !== prevAccountState?.id) {
      hasAccountChanged = true
    }
  }

  return { account: accountState, hasChanged: hasAccountChanged }
}

export const exchangeAuthCodeForRefreshToken = async (props: bp.HandlerProps, oAuthCode: string): Promise<void> => {
  const authClient = new DocusignAuthClient()
  const tokenResp = await authClient.getAccessTokenWithCode(oAuthCode)
  if (!tokenResp.success) throw tokenResp.error

  const userInfoResp = await authClient.getUserInfo(tokenResp.data.accessToken, tokenResp.data.tokenType)
  if (!userInfoResp.success) throw userInfoResp.error

  await applyOAuthState(props, tokenResp.data)

  await props.client.configureIntegration({
    identifier: userInfoResp.data.sub,
  })
}

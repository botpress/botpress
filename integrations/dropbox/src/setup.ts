import * as sdk from '@botpress/sdk'
import { DropboxClient } from './dropbox-api'
import { getAuthorizationCode } from './dropbox-api/oauth-client'
import * as bp from '.botpress'

type RegisterProps = Parameters<bp.IntegrationProps['register']>[0]

export const register: bp.IntegrationProps['register'] = async (props) => {
  if (await _isAlreadyAuthenticatedWithSameCredentials(props)) {
    return
  }

  await _authenticate(props)
  await _saveRegistrationDate(props)
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}

const _isAlreadyAuthenticatedWithSameCredentials = async (props: RegisterProps): Promise<boolean> => {
  try {
    const dropboxClient = await DropboxClient.create(props)
    const authenticationSucceeded = await dropboxClient.isProperlyAuthenticated()

    if (!authenticationSucceeded) {
      return false
    }

    if (props.ctx.configurationType !== 'manual') {
      return true
    }

    // For manual configurations, compare the authorization code from context with the one in state
    const { state } = await props.client.getState({
      type: 'integration',
      id: props.ctx.integrationId,
      name: 'authorization',
    })

    const currentAuthorizationCode = getAuthorizationCode({ ctx: props.ctx })
    return state.payload.authorizationCode === currentAuthorizationCode
  } catch {}

  return false
}

const _authenticateWithRefreshToken = async (props: RegisterProps): Promise<boolean> => {
  const dropboxClient = await DropboxClient.create(props)
  return dropboxClient.isProperlyAuthenticated()
}

const _authenticateWithAuthorizationCode = async (props: RegisterProps): Promise<boolean> => {
  const { logger } = props
  await DropboxClient.processAuthorizationCode(props)
  const dropboxClient = await DropboxClient.create(props)
  const authenticated = await dropboxClient.isProperlyAuthenticated()
  if (authenticated) {
    logger?.forBot().info('Successfully created Dropbox client from authorization code')
  }
  return authenticated
}

const _authenticateManual = async (props: RegisterProps): Promise<boolean> => {
  const { ctx, logger } = props
  const authorizationCode = getAuthorizationCode({ ctx })

  if (!authorizationCode) {
    logger?.forBot().info('No authorization code provided, using existing refresh token from state')
    return _authenticateWithRefreshToken(props).catch((err) => {
      logger?.forBot().warn({ err }, 'Failed to authenticate with existing refresh token')
      return false
    })
  }

  logger?.forBot().info('Using authorization code from context')
  let isAuthenticated = false
  isAuthenticated = await _authenticateWithAuthorizationCode(props).catch((err) => {
    logger?.forBot().warn({ err }, 'Failed to create Dropbox client from authorization code; falling back')
    return false
  })
  if (!isAuthenticated) {
    isAuthenticated = await _authenticateWithAuthorizationCode(props).catch((err) => {
      logger?.forBot().error({ err }, 'Failed to authenticate with fallback')
      return false
    })
  }
  return isAuthenticated
}

const _authenticateOAuth = async (props: RegisterProps): Promise<boolean> => {
  const { logger } = props
  logger?.forBot().info('Using refresh token from state')
  return _authenticateWithRefreshToken(props).catch((err) => {
    logger?.forBot().warn({ err }, 'Failed to authenticate with existing refresh token')
    return false
  })
}

const _getAuthFailureMessage = (configurationType: string): string => {
  if (configurationType === 'manual') {
    return (
      'Dropbox authentication failed. ' +
      'Please note that the Access Code is only valid for a few minutes. ' +
      'You may need to reauthorize your Dropbox application by navigating ' +
      "to the authorization URL and update the integration's config accordingly."
    )
  }
  return (
    'Dropbox authentication failed. ' +
    'Please use the OAuth wizard to re-authenticate your Dropbox application. ' +
    'You can access the wizard through the integration configuration page.'
  )
}

const _authenticate = async (props: RegisterProps): Promise<void> => {
  const { ctx } = props
  const isManual = ctx.configurationType === 'manual'

  const authenticationSucceeded = isManual ? await _authenticateManual(props) : await _authenticateOAuth(props)

  if (!authenticationSucceeded) {
    throw new sdk.RuntimeError(_getAuthFailureMessage(ctx.configurationType ?? ''))
  }
}

const _saveRegistrationDate = async (props: RegisterProps): Promise<void> => {
  await props.client.setState({
    id: props.ctx.integrationId,
    type: 'integration',
    name: 'setupMeta',
    payload: {
      integrationRegisteredAt: new Date().toISOString(),
    },
  })
}

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

const _authenticate = async (props: RegisterProps): Promise<void> => {
  const { ctx, logger } = props
  let authenticationSucceeded = false

  const createFromRefreshToken = async () => {
    try {
      const dropboxClient = await DropboxClient.create(props)
      return await dropboxClient.isProperlyAuthenticated()
    } catch (err) {
      logger?.forBot().error({ err }, 'Failed to create Dropbox client from refresh token')
      throw err
    }
  }

  if (ctx.configurationType !== 'manual') {
    logger?.forBot().info('Using refresh token from state')
    try {
      authenticationSucceeded = await createFromRefreshToken()
    } catch (err) {
      logger?.forBot().warn({ err }, 'Failed to authenticate with existing refresh token')
      authenticationSucceeded = false
    }
  } else {
    const authorizationCode = getAuthorizationCode({ ctx })
    if (!authorizationCode) {
      logger?.forBot().info('No authorization code provided, using existing refresh token from state')
      try {
        authenticationSucceeded = await createFromRefreshToken()
      } catch (err) {
        logger?.forBot().warn({ err }, 'Failed to authenticate with existing refresh token')
        authenticationSucceeded = false
      }
    } else {
      logger?.forBot().info('Using authorization code from context')
      try {
        await DropboxClient.processAuthorizationCode(props)
        const dropboxClient = await DropboxClient.create(props)
        authenticationSucceeded = await dropboxClient.isProperlyAuthenticated()
        logger?.forBot().info('Successfully created Dropbox client from authorization code')
      } catch (err) {
        logger?.forBot().warn({ err }, 'Failed to create Dropbox client from authorization code; falling back')
        try {
          authenticationSucceeded = await createFromRefreshToken()
        } catch (fallbackErr) {
          logger?.forBot().error({ err: fallbackErr }, 'Failed to authenticate with fallback')
          authenticationSucceeded = false
        }
      }
    }
  }

  if (!authenticationSucceeded) {
    throw new sdk.RuntimeError(
      'Dropbox authentication failed. ' +
        'Please note that the Access Code is only valid for a few minutes. ' +
        'You may need to reauthorize your Dropbox application by navigating ' +
        "to the authorization URL and update the integration's config accordingly."
    )
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

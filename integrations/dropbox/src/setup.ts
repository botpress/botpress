import * as sdk from '@botpress/sdk'
import { DropboxClient } from './dropbox-api'
import * as bp from '.botpress'

type RegisterProps = Parameters<bp.IntegrationProps['register']>[0]

export const register: bp.IntegrationProps['register'] = async (props) => {
  if (await _isAlreadyAuthenticatedWithSameCredentials(props)) {
    return
  }

  await _authenticate(props)
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

    return state.payload.authorizationCode === props.ctx.configuration.authorizationCode
  } catch {}

  return false
}

const _authenticate = async (props: RegisterProps): Promise<void> => {
  let authenticationSucceeded = false

  try {
    await DropboxClient.processAuthorizationCode(props)
    const dropboxClient = await DropboxClient.create(props)
    authenticationSucceeded = await dropboxClient.isProperlyAuthenticated()
  } catch (thrown: unknown) {
    console.error('Failed to authenticate with Dropbox', thrown)
    authenticationSucceeded = false
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

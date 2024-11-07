import { getOAuthClient } from './auth'

export const register = async () => {
  // TODO: Verification auth?
}

export const unregister = async () => {
  await getOAuthClient().revokeCredentials() // TODO: Necessary? Does it only revoke the refresh token?
}

import { getCredentials, validateCredentials } from './credentials'
import * as bp from '.botpress'

export const register: bp.Integration['register'] = async ({ client, ctx }) => {
  const credentials = await getCredentials({ client, ctx })
  await validateCredentials(credentials)
}

export const unregister: bp.Integration['unregister'] = async () => {}

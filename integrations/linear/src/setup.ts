import { LinearOauthClient } from './misc/linear'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ client, ctx }) => {
  await LinearOauthClient.create({ client, ctx })
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {
  // nothing to unregister
}

import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ client, ctx }) => {
  if (ctx.configurationType === null && bp.secrets.DISABLE_OAUTH === 'true') {
    await client.configureIntegration({
      identifier: null,
    })
    throw new RuntimeError('OAuth currently unavailable, please use manual configuration instead')
  }
}
export const unregister: bp.IntegrationProps['unregister'] = async () => {}

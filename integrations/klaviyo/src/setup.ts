import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ ctx }) => {
  const { apiKey } = ctx.configuration

  if (!apiKey) {
    throw new RuntimeError('API Key is required for manual configuration')
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}

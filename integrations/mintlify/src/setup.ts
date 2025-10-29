import { RuntimeError } from '@botpress/client'
import { AxiosError } from 'axios'
import { getAxiosClient } from './utils/axiosClient'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ ctx, client, logger }) => {
  try {
    const mintlifyClient = await getAxiosClient({ ctx, client })
    await mintlifyClient.get('jobs')
    logger.forBot().info('Validated API key and project ID')
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      const status = error.response?.status

      if (status === 400) {
        throw new RuntimeError('400 - Bad Request: Invalid project ID')
      }
      if (status === 401) {
        throw new RuntimeError(`401 - Unauthorized: ${error.response?.data?.error || 'Unable to validate API key'}`)
      }
    }
    const message = error instanceof Error ? error.message : String(error)
    throw new RuntimeError(`Failed to validate configuration: ${message}`)
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}

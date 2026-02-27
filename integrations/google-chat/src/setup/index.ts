import * as bp from '.botpress'
import { getClient } from '../client'

export const register: bp.IntegrationProps['register'] = async ({ ctx, logger }) => {
  try {
    logger.forBot().info('Starting registration...')

    if (!ctx.configuration.serviceAccountJson) {
      logger.forBot().error('Service account JSON is missing')
      throw new Error('Service account JSON is required')
    }

    const saKey = JSON.parse(ctx.configuration.serviceAccountJson)
    logger.forBot().info('Using service account:', saKey.client_email)

    const client = getClient(ctx)
    logger.forBot().info('Client created, listing spaces...')

    const spaces = await client.listSpaces()
    logger.forBot().info('Spaces found:', spaces.spaces?.length || 0)

    if (!spaces.spaces || spaces.spaces.length === 0) {
      logger.forBot().error('No spaces found')
      throw new Error(
        'No spaces found. Please ensure the service account has been added to at least one Google Chat space.'
      )
    }

    logger.forBot().info('Registration completed successfully')
  } catch (error: any) {
    logger.forBot().error('Registration failed:', error)
    throw error
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ ctx }) => {
  // Nothing to clean up
}

export { handler } from './handler'

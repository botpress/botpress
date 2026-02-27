import { getClient } from '../client'
import * as bpclient from '@botpress/client'
import type { RegisterFunction } from '../misc/types'

export const register: RegisterFunction = async ({ ctx, client, logger }) => {
  try {
    const apifyClient = getClient(ctx.configuration.apiToken, client, logger, ctx.integrationId, ctx)

    // Test the Apify connection by trying to list actors
    // This will verify that the API token is valid
    const actorCollectionClient = apifyClient['client'].actors()
    const { items } = await actorCollectionClient.list({ limit: 1 })

    logger.forBot().info('Successfully connected to Apify API')
    logger.forBot().debug(`Found ${items.length} actors in your account`)

    logger.forBot().info('Apify integration registered successfully')
  } catch (error) {
    logger.forBot().error('Failed to connect to Apify API: Check your API token', error)

    throw new bpclient.RuntimeError('Configuration Error! Please check your Apify API token.')
  }
}

import { DatadogClient } from './datadog-client'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ logger, ctx, client }) => {
  logger.forBot().info('Registering Datadog integration')

  const datadogClient = await DatadogClient.create({ ctx, client })
  // Test connection by querying a simple metric
  const now = Math.floor(Date.now() / 1000)
  await datadogClient.queryMetrics({
    query: 'system.cpu.user{*}',
    from: now - 3600,
    to: now,
  })

  logger.forBot().info(`Successfully connected to Datadog site: ${ctx.configuration.site || 'datadoghq.com'}`)
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}


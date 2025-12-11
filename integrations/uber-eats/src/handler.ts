import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, client, logger }) => {
  const data = JSON.parse(req.body ?? '{}')

  logger.forBot().info('Received Uber Eats webhook:', data)

  return { status: 200 }
}

import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ logger, req }) => {
  logger.forBot().debug('Received unsupported webhook event', { path: req.path, query: req.query })
}

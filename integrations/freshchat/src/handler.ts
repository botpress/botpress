
import { IntegrationProps } from '.botpress'

export const handler: IntegrationProps['handler'] = async ({ req, logger }) => {
  if (!req.body) {
    logger.forBot().warn('Handler received an empty body')
    return
  }
}

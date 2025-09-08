// TODO: Implement this handler

import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  props.logger.forBot().info('Handler received request from Loops with payload:', props.req.body)
}
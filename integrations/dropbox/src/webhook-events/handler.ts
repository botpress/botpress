import * as bp from '.botpress'

export const handler = async (props: bp.HandlerProps) => {
  const { req, logger } = props

  logger.forBot().info('Got request: ' + JSON.stringify(req))
}

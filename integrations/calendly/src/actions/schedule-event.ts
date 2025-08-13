import type * as bp from '.botpress'

export const scheduleEvent: bp.IntegrationProps['actions']['scheduleEvent'] = async ({ ctx, input, logger }) => {
  // TODO: Implement this action
  logger.debug('Scheduling event with input:\n', JSON.stringify({ ctx, input }, null, 2))

  return {}
}

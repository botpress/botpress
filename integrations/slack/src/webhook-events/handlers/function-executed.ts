import type * as bp from '.botpress'
import type { FunctionExecutedEvent } from '@slack/types'

export const handleEvent = async ({
  slackEvent,
  logger,
  client,
}: {
  slackEvent: FunctionExecutedEvent
  client: bp.Client
  logger: bp.Logger
}) => {
  if (slackEvent.function.callback_id !== 'botpress-webook') {
    logger.forBot().debug(`Ignoring unsupported workflow function ${slackEvent.function.callback_id}`)
    return
  }

  const inputValues = slackEvent.inputs.value
  const inputUserId = slackEvent.inputs.userId

  if (!Array.isArray(inputValues)) {
    logger.forBot().debug(`Ignoring unsupported workflow function input value type ${typeof inputValues}`)
    return
  }

  const userId = typeof inputUserId === 'string' ? inputUserId : undefined

  if (inputUserId && typeof inputUserId !== 'string') {
    logger.forBot().debug(`Ignoring unsupported workflow function input userId type ${typeof inputUserId}`)
    return
  }

  const inputValue = inputValues[0]

  await client.createEvent({
    type: 'workflowWebhook',
    payload: {
      userId,
      value: inputValue,
    },
  })
}

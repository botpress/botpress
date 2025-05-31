import { FunctionExecutedEvent } from '@slack/types'
import * as bp from '.botpress'

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

  if (!Array.isArray(inputValues)) {
    logger.forBot().debug(`Ignoring unsupported workflow function input value type ${typeof inputValues}`)
    return
  }

  const inputValue = inputValues[0]

  await client.createEvent({
    type: 'workflowWebhook',
    payload: {
      value: inputValue,
    },
  })
}

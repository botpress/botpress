import { createActionWrapper } from '@botpress/common'
import { wrapWithTryCatch } from '../google-api/error-handling'
import { GoogleClient } from '../google-api/google-client'
import * as bp from '.botpress'

const MAX_LOG_INPUT_SIZE = 2000

function trimInput(input: unknown): unknown {
  try {
    const stringified = JSON.stringify(input, null, 2)
    if (stringified.length <= MAX_LOG_INPUT_SIZE) {
      return input
    }
    return stringified.substring(0, MAX_LOG_INPUT_SIZE) + '\n... (truncated)'
  } catch {
    const stringified = String(input)
    if (stringified.length <= MAX_LOG_INPUT_SIZE) {
      return input
    }
    return stringified.substring(0, MAX_LOG_INPUT_SIZE) + '... (truncated)'
  }
}

export const wrapAction: typeof _wrapAction = (meta, actionImpl) =>
  _wrapAction(meta, (props) =>
    wrapWithTryCatch(() => {
      props.logger.forBot().debug(`Running action "${meta.actionName}" [bot id: ${props.ctx.botId}]`, {
        input: trimInput(props.input),
      })

      return actionImpl(props as Parameters<typeof actionImpl>[0], props.input)
    }, `Action Error: ${meta.errorMessageWhenFailed}`)()
  )

const _wrapAction = createActionWrapper<bp.IntegrationProps>()({
  toolFactories: {
    googleClient: GoogleClient.create,
  },
  extraMetadata: {} as {
    errorMessageWhenFailed: string
  },
})

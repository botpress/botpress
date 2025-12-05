import { createActionWrapper, posthogHelper } from '@botpress/common'
import { posthogConfig } from 'src'
import { wrapWithTryCatch } from '../google-api/error-handling'
import { GoogleClient } from '../google-api/google-client'
import * as bp from '.botpress'

export const wrapAction: typeof _wrapAction = (meta, actionImpl) =>
  _wrapAction(meta, (props) => {
    const startTime = Date.now()

    props.logger
      .forBot()
      .debug(`Running action "${meta.actionName}" [bot id: ${props.ctx.botId}]`, { input: trimInput(props.input) })

    return wrapWithTryCatch(() => {
      const result = actionImpl(props as Parameters<typeof actionImpl>[0], props.input)

      void Promise.resolve(result).then(() => {
        const executionTimeMs = Date.now() - startTime
        posthogHelper
          .sendPosthogEvent(
            {
              distinctId: props.ctx.integrationId,
              event: 'action_executed',
              properties: {
                actionName: meta.actionName,
                botId: props.ctx.botId,
                executionTimeMs,
                success: true,
              },
            },
            posthogConfig
          )
          .catch(() => {})
      })

      return result
    }, `Action Error: ${meta.errorMessageWhenFailed}`)()
  })

const _wrapAction = createActionWrapper<bp.IntegrationProps>()({
  toolFactories: {
    googleClient: GoogleClient.create,
  },
  extraMetadata: {} as {
    errorMessageWhenFailed: string
  },
})

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

import { createActionWrapper, createAsyncFnWrapperWithErrorRedaction } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { ClickUpClient } from '../client'
import * as bp from '.botpress'

export const wrapAction: typeof _wrapAction = (meta, actionImpl) =>
  _wrapAction(meta, (props) =>
    _wrapAsyncFnWithTryCatch(() => {
      props.logger
        .forBot()
        .debug(`Running action "${meta.actionName}" [bot id: ${props.ctx.botId}]`, { input: props.input })

      return actionImpl(props as Parameters<typeof actionImpl>[0], props.input)
    }, `Action Error: ${meta.errorMessage}`)()
  )

const _wrapAction = createActionWrapper<bp.IntegrationProps>()({
  toolFactories: {
    clickupClient: ({ ctx }) => new ClickUpClient(ctx.configuration.apiKey, ctx.configuration.teamId),
  },
  extraMetadata: {} as {
    errorMessage: string
  },
})

const _wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction((error: Error, customMessage: string) => {
  if (error instanceof sdk.RuntimeError) {
    return error
  }

  console.warn(customMessage, error)
  return new sdk.RuntimeError(customMessage)
})

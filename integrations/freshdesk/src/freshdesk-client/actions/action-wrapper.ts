import { createActionWrapper, createAsyncFnWrapperWithErrorRedaction } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { FreshdeskClient } from '../FreshdeskClient'
import { createFreshdeskRuntimeError } from './errors'
import * as bp from '.botpress'

export const wrapAction: typeof _wrapAction = (meta, actionImpl) =>
  _wrapAction(meta, (props) => {
    const logger = props.logger.forBot()

    logger.debug(`Running action "${meta.actionName}" [bot id: ${props.ctx.botId}]`, { input: props.input })

    return _wrapAsyncFnWithTryCatch(async () => {
      try {
        return await actionImpl(props as Parameters<typeof actionImpl>[0], props.input)
      } catch (thrown: unknown) {
        if (!(thrown instanceof sdk.RuntimeError)) {
          logger.warn(`Action Error: ${meta.errorMessage}`, {
            error: thrown instanceof Error ? thrown.message : String(thrown),
          })
        }
        throw thrown
      }
    }, `Action Error: ${meta.errorMessage}`)() as ReturnType<typeof actionImpl>
  })

const _wrapAction = createActionWrapper<bp.IntegrationProps>()({
  toolFactories: {
    freshdeskClient: ({ ctx }) => new FreshdeskClient(ctx.configuration.domain, ctx.configuration.apiKey),
  },
  extraMetadata: {} as {
    errorMessage: string
  },
})

const _wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction((error: Error) => {
  if (error instanceof sdk.RuntimeError) {
    return error
  }
  return createFreshdeskRuntimeError(error)
})

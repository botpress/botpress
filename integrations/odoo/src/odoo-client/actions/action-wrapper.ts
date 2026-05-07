import { createActionWrapper, createAsyncFnWrapperWithErrorRedaction } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { OdooClient } from '../OdooClient'
import { createOdooRuntimeError } from './errors'
import * as bp from '.botpress'

export const wrapAction: typeof _wrapAction = (meta, actionImpl) =>
  _wrapAction(meta, (props) => {
    const logger = props.logger.forBot()

    logger.debug(`Running action "${meta.actionName}" [bot id: ${props.ctx.botId}]`, { input: props.input })

    return _wrapAsyncFnWithTryCatch(() => {
      const output = actionImpl(props as Parameters<typeof actionImpl>[0], props.input)

      return output.catch((thrown) => {
        if (!(thrown instanceof sdk.RuntimeError)) {
          logger.warn(`Action Error: ${meta.errorMessage}`, {
            error: thrown instanceof Error ? thrown.message : String(thrown),
          })
        }

        throw thrown
      }) as typeof output
    }, `Action Error: ${meta.errorMessage}`)()
  })

const _wrapAction = createActionWrapper<bp.IntegrationProps>()({
  toolFactories: {
    odooClient: ({ ctx }) =>
      new OdooClient(ctx.configuration.url, ctx.configuration.apiKey, ctx.configuration.database),
  },
  extraMetadata: {} as {
    errorMessage: string
  },
})

const _wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction((error: Error) => {
  if (error instanceof sdk.RuntimeError) {
    return error
  }

  return createOdooRuntimeError(error)
})

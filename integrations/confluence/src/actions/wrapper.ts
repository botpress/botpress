import { createActionWrapper, createAsyncFnWrapperWithErrorRedaction, defaultErrorRedactor } from '@botpress/common'
import * as bp from '@botpress/sdk'

export const wrapAction: typeof _wrapActionAndInjectTools = (meta, actionImpl) =>
  _wrapActionAndInjectTools(meta, (props) =>
    wrapAsyncFnWithTryCatch(() => {
      props.logger.forBot().debug(`Running action "${meta.actionName}"`)

      return actionImpl(props as Parameters<typeof actionImpl>[0], props.input)
    }, `Action Error: ${meta.errorMessage}`)()
  )

const _wrapActionAndInjectTools = createActionWrapper<bp.IntegrationProps>()({
  toolFactories: {},
  extraMetadata: {} as {
    errorMessage: string
  },
})

export const wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction(defaultErrorRedactor)

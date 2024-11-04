import { createActionWrapper } from '@botpress/common'
import { getClient } from '../google-api/google-client'
import { wrapAsyncFnWithTryCatch } from '../google-api/error-handling'
import * as bp from '.botpress'

export const wrapAction: typeof _wrapAction = (meta, actionImpl) =>
  _wrapAction(meta, (props) =>
    wrapAsyncFnWithTryCatch(() => {
      props.logger
        .forBot()
        .debug(`Running action "${meta.actionName}" [bot id: ${props.ctx.botId}]`, { input: props.input })

      return actionImpl(props as Parameters<typeof actionImpl>[0], props.input)
    }, `Action Error: ${meta.errorMessageWhenFailed}`)()
  )

const _wrapAction = createActionWrapper<bp.IntegrationProps>()({
  toolFactories: {
    googleClient: async (props) => await getClient(props),
  },
  extraMetadata: {} as {
    errorMessageWhenFailed: string
  },
})

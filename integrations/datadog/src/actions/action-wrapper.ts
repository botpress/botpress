import { createActionWrapper } from '@botpress/common'
import { DatadogClient, wrapAsyncFnWithTryCatch } from '../datadog-client'
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
    datadogClient: DatadogClient.create,
  },
  extraMetadata: {} as {
    errorMessageWhenFailed: string
  },
})


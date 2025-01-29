import { createActionWrapper } from '@botpress/common'
import { TodoistClient, wrapAsyncFnWithTryCatch } from '../todoist-api'
import * as bp from '.botpress'

export const wrapAction: typeof _wrapAction = (meta, actionImpl) =>
  _wrapAction(meta, (props) =>
    // NOTE: the TodoistClient class already has error handling with error
    //       redaction, so this try-catch wrapper will only ever be called
    //       if there's an error in the action implementation itself
    wrapAsyncFnWithTryCatch(() => {
      props.logger
        .forBot()
        .debug(`Running action "${meta.actionName}" [bot id: ${props.ctx.botId}]`, { input: props.input })

      return actionImpl(props as Parameters<typeof actionImpl>[0], props.input)
    }, `Action Error: ${meta.errorMessageWhenFailed}`)()
  )

const _wrapAction = createActionWrapper<bp.IntegrationProps>()({
  toolFactories: {
    todoistClient: TodoistClient.create,
  },
  extraMetadata: {} as {
    errorMessageWhenFailed: string
  },
})

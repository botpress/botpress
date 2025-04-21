import { createActionWrapper } from '@botpress/common'
import { wrapAsyncFnWithTryCatch, SlackClient } from '../slack-api'
import * as bp from '.botpress'

export const wrapActionAndInjectSlackClient: typeof _wrapActionAndInjectTools = (meta, actionImpl) =>
  _wrapActionAndInjectTools(meta, (props) =>
    wrapAsyncFnWithTryCatch(() => {
      props.logger.forBot().debug(`Running action "${meta.actionName}" [bot id: ${props.ctx.botId}]`)

      return actionImpl(props as Parameters<typeof actionImpl>[0], props.input)
    }, `Action Error: ${meta.errorMessage}`)()
  )

const _wrapActionAndInjectTools = createActionWrapper<bp.IntegrationProps>()({
  toolFactories: {
    slackClient: (props) => SlackClient.createFromStates(props),
  },
  extraMetadata: {} as {
    errorMessage: string
  },
})

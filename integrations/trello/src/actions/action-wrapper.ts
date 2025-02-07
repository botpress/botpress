import { createActionWrapper } from '@botpress/common'
import { TrelloClient } from '../trello-api/trello-client'
import * as bp from '.botpress'

export const wrapAction: typeof _wrapAction = (meta, actionImpl) =>
  _wrapAction(meta, (props) => {
    props.logger
      .forBot()
      .debug(`Running action "${meta.actionName}" [bot id: ${props.ctx.botId}]`, { input: props.input })

    return actionImpl(props as Parameters<typeof actionImpl>[0], props.input)
  })

const _wrapAction = createActionWrapper<bp.IntegrationProps>()({
  toolFactories: {
    trelloClient: ({ ctx }) => new TrelloClient({ ctx }),
  },
})

import { createActionWrapper } from '@botpress/common'
import { N8nClient } from './client'
import * as bp from '.botpress'

const _wrapAction = createActionWrapper<bp.IntegrationProps>()({
  toolFactories: {
    n8nClient: ({ ctx }) => new N8nClient(ctx.configuration),
  },
})

export const wrapAction: typeof _wrapAction = (meta, actionImpl) =>
  _wrapAction(meta, (props) => {
    props.logger.forBot().debug(`Running action "${meta.actionName}"`, { input: props.input })
    return actionImpl(props as Parameters<typeof actionImpl>[0], props.input)
  })

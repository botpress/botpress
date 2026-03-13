import { createActionWrapper } from '@botpress/common'
import { wrapAsyncFnWithTryCatch } from '../api/error-handling'
import { AirtableApi } from '../client'
import * as bp from '.botpress'

const _wrapAction = createActionWrapper<bp.IntegrationProps>()({
  toolFactories: {
    airtableClient: ({ client, ctx, logger }) => new AirtableApi({ client, ctx, logger }),
  },
  extraMetadata: {} as {
    errorMessage: string
  },
})

export const wrapAction: typeof _wrapAction = (meta, actionImpl) =>
  _wrapAction(meta, (props) =>
    wrapAsyncFnWithTryCatch(() => {
      props.logger.forBot().debug(`Running action "${meta.actionName}" [bot id: ${props.ctx.botId}]`)

      return actionImpl(props as Parameters<typeof actionImpl>[0], props.input)
    }, `Action Error: ${meta.errorMessage}`)()
  )

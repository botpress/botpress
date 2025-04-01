import { createActionWrapper } from '@botpress/common'
import { NotionClient, wrapAsyncFnWithTryCatch } from './notion-api'
import * as bp from '.botpress'

export const wrapAction: typeof _wrapActionAndInjectTools = (meta, actionImpl) =>
  _wrapActionAndInjectTools(meta, (props) =>
    wrapAsyncFnWithTryCatch(() => {
      props.logger.forBot().debug(`Running action "${meta.actionName}"`)

      return actionImpl(props as Parameters<typeof actionImpl>[0], props.input)
    }, `Action Error: ${meta.errorMessage}`)()
  )

const _wrapActionAndInjectTools = createActionWrapper<bp.IntegrationProps>()({
  toolFactories: {
    notionClient: NotionClient.create,
  },
  extraMetadata: {} as {
    errorMessage: string
  },
})

import { createActionWrapper } from '@botpress/common'
import { wrapAsyncFnWithTryCatch } from './error-handling'
import { GitHubClient } from './github-client'
import { GithubSettings } from './github-settings'
import * as bp from '.botpress'

export const wrapActionAndInjectOctokit: typeof _wrapActionAndInjectTools = (meta, actionImpl) =>
  _wrapActionAndInjectTools(meta, (props) =>
    wrapAsyncFnWithTryCatch(() => {
      props.logger
        .forBot()
        .debug(`Running action "${meta.actionName}" for owner "${props.owner}" [bot id: ${props.ctx.botId}]`)

      return actionImpl(props as Parameters<typeof actionImpl>[0], props.input)
    }, `Action Error: ${meta.errorMessage}`)()
  )

const _wrapActionAndInjectTools = createActionWrapper<bp.IntegrationProps>()({
  toolFactories: {
    octokit: ({ ctx, client }) => GitHubClient.create({ ctx, client }),
    owner: ({ ctx, client }) => GithubSettings.getOrganizationHandle({ ctx, client }),
  },
  extraMetadata: {} as {
    errorMessage: string
  },
})

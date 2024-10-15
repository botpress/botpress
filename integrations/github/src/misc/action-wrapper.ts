import { GitHubClient } from './github-client'
import { GithubSettings } from './github-settings'
import * as bp from '.botpress'
import { createActionWrapper } from '@botpress/common'
import { wrapWithTryCatch } from './error-handling'

export type ChannelProps = Parameters<Parameters<typeof _wrapActionAndInjectTools>[1]>[0]

export const wrapActionAndInjectOctokit: typeof _wrapActionAndInjectTools = (actionName, actionImpl) =>
  _wrapActionAndInjectTools(actionName, (props) =>
    wrapWithTryCatch(() => {
      props.logger
        .forBot()
        .debug(`Running action "${actionName}" for owner "${props.owner}" [bot id: ${props.ctx.botId}]`)

      return actionImpl(props as Parameters<typeof actionImpl>[0], props.input)
    }, `Action Error: Failed to run action ${actionName}`)()
  )

const _wrapActionAndInjectTools = createActionWrapper<bp.IntegrationProps>()({
  octokit: ({ ctx, client }) => GitHubClient.create({ ctx, client }),
  owner: ({ ctx, client }) => GithubSettings.getOrganizationHandle({ ctx, client }),
})

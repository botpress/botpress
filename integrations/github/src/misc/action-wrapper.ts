import { RuntimeError } from '@botpress/client'
import { createActionWrapper } from '@botpress/common'
import { wrapAsyncFnWithTryCatch } from './error-handling'
import { GitHubClient } from './github-client'
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
    owner: async ({ ctx, client, input }) => {
      console.log(input.organization)
      if (input.organization) {
        return input.organization
      }
      const user = await client.getUser({
        id: ctx.botUserId,
      })
      console.log(user.user.name)
      if (!user.user.name) {
        throw new RuntimeError('No user or organization was provided. Cannot query the repository.')
      }
      return user.user.name
    },
  },
  extraMetadata: {} as {
    errorMessage: string
  },
})

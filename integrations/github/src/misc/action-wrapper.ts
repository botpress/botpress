import * as sdk from '@botpress/sdk'
import { GitHubClient } from './github-client'
import { GithubSettings } from './github-settings'
import * as bp from '.botpress'

type Actions = {
  [K in keyof bp.IntegrationProps['actions']]: bp.IntegrationProps['actions'][K]
}
type ActionInjections = { octokit: GitHubClient; owner: string }
type ActionKey = keyof Actions
type BaseActionParams<A extends ActionKey> = Parameters<Actions[A]>[0]
type ActionParamsWithInjections<A extends ActionKey> = BaseActionParams<A> & ActionInjections
type WrapActionFunction = <A extends ActionKey>(
  actionName: A,
  impl: {
    action: (props: ActionParamsWithInjections<A>, input: BaseActionParams<A>['input']) => ReturnType<Actions[A]>
    errorMessage: string
  }
) => (props: BaseActionParams<A>) => any

/**
 * @example
 * export const createIssue = wrapActionAndInjectOctokit('createIssue', {
 *   async action({ octokit, owner, ctx, client }, { issueTitle }) {
 *      // Your action logic here
 *   },
 *   errorMessage: 'Failed to create issue'
 * })
 */
export const wrapActionAndInjectOctokit: WrapActionFunction =
  (actionName, { action, errorMessage }) =>
  async (props) => {
    const octokit = await GitHubClient.create({ ctx: props.ctx, client: props.client })
    const owner = await GithubSettings.getOrganizationHandle({ ctx: props.ctx, client: props.client })
    const injections = { octokit, owner }

    return _tryCatch(() => {
      props.logger.forBot().debug(`Running action "${actionName}" for owner "${owner}" [bot id: ${props.ctx.botId}]`)

      return action({ ...props, ...injections }, props.input)
    }, errorMessage)
  }

const _tryCatch = async <T>(fn: () => Promise<T>, errorMessage: string): Promise<T> => {
  try {
    return await fn()
  } catch (thrown: unknown) {
    console.error(`Action Error: ${errorMessage}`, thrown)
    throw new sdk.RuntimeError(errorMessage)
  }
}

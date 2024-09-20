import { RuntimeError } from '@botpress/sdk'
import { GitHubClient } from './github-client'
import { GithubSettings } from './github-settings'
import { IntegrationProps } from '.botpress'

type Actions = {
  [K in keyof IntegrationProps['actions']]: IntegrationProps['actions'][K]
}
type ActionInjections = { octokit: GitHubClient; owner: string }
type ActionWithInjections = {
  [K in keyof Actions]: (
    props: Parameters<Actions[K]>[0] & ActionInjections,
    input: Parameters<Actions[K]>[0]['input']
  ) => ReturnType<Actions[K]>
}

const tryCatch = async <T>(fn: () => Promise<T>, errorMessage: string): Promise<T> => {
  try {
    return await fn()
  } catch (thrown: unknown) {
    console.error(`Error: ${errorMessage}`, thrown)
    throw new RuntimeError(errorMessage)
  }
}

/**
 * @example
 * export const createIssue = wrapActionAndInjectOctokit('createIssue', {
 *   async action({ octokit, owner, ctx, client }, { issueTitle }) {
 *      // Your action logic here
 *   },
 *   errorMessage: 'Failed to create issue'
 * })
 */
export const wrapActionAndInjectOctokit = <K extends keyof Actions>(
  actionName: K,
  {
    action,
    errorMessage,
  }: {
    action: ActionWithInjections[K]
    errorMessage: string
  }
): Actions[K] =>
  (async (props: Parameters<Actions[K]>[0]) => {
    const octokit = await GitHubClient.create({ ctx: props.ctx, client: props.client })
    const owner = await GithubSettings.getOrganizationHandle({ ctx: props.ctx, client: props.client })
    const injections = { octokit, owner }

    return tryCatch(() => {
      props.logger.forBot().debug(`Running action "${actionName}" for owner "${owner}" [bot id: ${props.ctx.botId}]`)

      return action({ ...props, ...injections }, props.input)
    }, errorMessage)
  }) as unknown as Actions[K]

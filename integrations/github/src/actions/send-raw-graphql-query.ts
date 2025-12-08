import { wrapActionAndInjectOctokit } from 'src/misc/action-wrapper'

export const sendRawGraphqlQuery = wrapActionAndInjectOctokit(
  { actionName: 'sendRawGraphqlQuery', errorMessage: 'Failed to query the GitHub GraphQL API' },
  async ({ octokit }, { query, parameters }) => {
    const mappedParams = parameters?.reduce(
      (mapped, param) => {
        mapped[param.name] = param.value
        return mapped
      },
      {} as Record<string, unknown>
    )
    const result = await octokit.executeRawGraphqlQuery(query, mappedParams)

    return {
      result,
    }
  }
)

import { wrapActionAndInjectOctokit } from 'src/misc/action-wrapper'

export const sendRawGraphqlQuery = wrapActionAndInjectOctokit(
  { actionName: 'sendRawGraphqlQuery', errorMessage: 'Failed to query the GitHub GraphQL API' },
  async ({ octokit }, { query, parameters }) => {
    const result = await octokit.executeRawGraphqlQuery(query, parameters)

    return {
      result,
    }
  }
)

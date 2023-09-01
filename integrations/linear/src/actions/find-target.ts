import { IssueConnection } from '@linear/sdk'

import { Target } from '../definitions/actions'
import { getLinearClient } from '../misc/utils'
import { IntegrationProps } from '.botpress'

const findIssues = async (issues: IssueConnection, targets: Target[]) => {
  const data = await issues.fetchNext()

  const allIssues = data.nodes.map<Target>((issue) => ({
    displayName: issue.title,
    tags: { id: issue.id },
    channel: 'issue',
  }))

  targets.push(...allIssues)

  if (data.pageInfo.hasNextPage) {
    await findIssues(issues, targets)
  }
}

export const findTarget: IntegrationProps['actions']['findTarget'] = async ({ input, client, ctx }) => {
  const targets: Target[] = []

  const linearClient = await getLinearClient(client, ctx.integrationId)
  const issues = await linearClient.issues({
    filter: {
      or: [
        { title: { contains: input.query } },
        { description: { contains: input.query } },
        { number: { eq: Number(input.query) } },
      ],
    },
  })

  await findIssues(issues, targets)

  return {
    targets,
  }
}

import { listIssues } from './list-issues'
import * as bp from '.botpress'

export const issueList: bp.IntegrationProps['actions']['issueList'] = async (args) => {
  const count = 20
  const startCursor = args.input.nextToken
  const res = await listIssues({
    ...args,
    type: 'listIssues',
    input: {
      count,
      startCursor,
    },
  })
  return {
    items: res.issues.map(({ linearIds: _, ...item }) => item),
    meta: { nextToken: res.nextCursor },
  }
}

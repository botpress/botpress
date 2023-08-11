import { LinearDocument } from '@linear/sdk'
import { Implementation } from '../misc/types'
import { getLinearClient } from '../misc/utils'

export const markAsDuplicate: Implementation['actions']['markAsDuplicate'] = async ({
  client,
  ctx,
  input: { issueId, relatedIssueId },
}) => {
  const linearClient = await getLinearClient(client, ctx.integrationId)
  await linearClient.createIssueRelation({
    issueId,
    relatedIssueId,
    type: LinearDocument.IssueRelationType.Duplicate,
  })

  return {}
}

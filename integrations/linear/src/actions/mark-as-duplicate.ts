import { LinearDocument } from '@linear/sdk'
import { getLinearClient } from '../misc/utils'
import { IntegrationProps } from '.botpress'

export const markAsDuplicate: IntegrationProps['actions']['markAsDuplicate'] = async ({
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

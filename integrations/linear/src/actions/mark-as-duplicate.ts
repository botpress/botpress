import { LinearDocument } from '@linear/sdk'
import { getLinearClient } from '../misc/utils'
import * as bp from '.botpress'

export const markAsDuplicate: bp.IntegrationProps['actions']['markAsDuplicate'] = async (args) => {
  const {
    ctx,
    input: { issueId, relatedIssueId },
  } = args
  const linearClient = await getLinearClient(args, ctx.integrationId)
  await linearClient.createIssueRelation({
    issueId,
    relatedIssueId,
    type: LinearDocument.IssueRelationType.Duplicate,
  })

  return {}
}

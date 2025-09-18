import { getLinearClient, getTeam } from '../misc/utils'
import { getIssueFromId } from './get-issue'
import * as bp from '.botpress'

export const updateIssue: bp.IntegrationProps['actions']['updateIssue'] = async (args) => {
  const {
    ctx,
    input: { issueId, teamName, labels, project, priority },
  } = args

  const linearClient = await getLinearClient(args, ctx.integrationId)

  const existingIssue = await linearClient.issue(issueId)
  const team = await getTeam(linearClient, await existingIssue.team, teamName)

  const labelIds = labels ? await team.findLabelIds(labels) : undefined
  const projectId = project ? await team.findProjectId(project) : undefined

  await linearClient.updateIssue(issueId, {
    priority,
    teamId: teamName ? team?.id : undefined,
    labelIds,
    projectId,
  })

  const issue = await getIssueFromId(linearClient, issueId)

  return { issue }
}

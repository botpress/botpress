import { getLinearClient, getTeam } from '../misc/utils'
import { getIssueFields } from './get-issue'
import { IntegrationProps } from '.botpress'

export const updateIssue: IntegrationProps['actions']['updateIssue'] = async ({
  ctx,
  client,
  input: { issueId, teamName, labels, project, priority },
}) => {
  const linearClient = await getLinearClient(client, ctx.integrationId)

  const existingIssue = await linearClient.issue(issueId)
  const team = await getTeam(linearClient, await existingIssue.team, teamName)

  const labelIds = labels ? await team.findLabelIds(labels) : undefined
  const projectId = project ? await team.findProjectId(project) : undefined

  const { issue: issueFetch } = await linearClient.updateIssue(issueId, {
    priority,
    teamId: teamName ? team?.id : undefined,
    labelIds,
    projectId,
    // slaBreachesAt: stringToDate(input.slaBreachesAt),
  })

  const issue = await issueFetch
  return issue ? { issue: getIssueFields(issue) } : {}
}

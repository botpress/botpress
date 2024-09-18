import { getIssueTags, getLinearClient, getTeam } from '../misc/utils'
import { getIssueFields } from './get-issue'
import * as bp from '.botpress'

export const createIssue: bp.IntegrationProps['actions']['createIssue'] = async (args) => {
  const {
    ctx,
    client,
    input: { title, description, priority, teamName, labels, project },
  } = args

  const linearClient = await getLinearClient(args, ctx.integrationId)

  const team = await getTeam(linearClient, undefined, teamName)

  if (!team.id) {
    throw new Error(`Could not find team "${teamName}"`)
  }

  const labelIds = labels ? await team.findLabelIds(labels) : undefined
  const projectId = project ? await team.findProjectId(project) : undefined

  let createAsUser: string | undefined = undefined
  let displayIconUrl: string | undefined = undefined
  if (ctx.configurationType === null) {
    createAsUser = ctx.configuration.displayName
    displayIconUrl = ctx.configuration.avatarUrl
  }

  const { issue: issueFetch } = await linearClient.createIssue({
    title,
    description,
    priority,
    teamId: team.id,
    labelIds,
    projectId,
    createAsUser,
    displayIconUrl,
  })

  const fullIssue = await issueFetch
  if (!fullIssue) {
    throw new Error('Could not create issue')
  }

  const issue = getIssueFields(fullIssue)
  const issueTags = await getIssueTags(fullIssue)

  await client.getOrCreateConversation({
    channel: 'issue',
    tags: issueTags,
  })

  return {
    issue,
  }
}

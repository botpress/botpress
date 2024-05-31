import { IssueCreated } from '../definitions/events'
import { LinearIssueEvent } from '../misc/linear'
import { getUserAndConversation } from '../misc/utils'
import * as bp from '.botpress'

type IssueProps = {
  linearEvent: LinearIssueEvent
  client: bp.Client
  ctx: bp.Context
}

export const fireIssueCreated = async ({ linearEvent, client, ctx }: IssueProps) => {
  const payload = {
    title: linearEvent.data.title,
    priority: linearEvent.data.priority,
    status: linearEvent.data.state.name,
    description: linearEvent.data.description,
    number: linearEvent.data.number,
    updatedAt: linearEvent.data.updatedAt,
    createdAt: linearEvent.data.createdAt,
    teamKey: linearEvent.data.team?.key,
    teamName: linearEvent.data.team?.name,
    labels: linearEvent.data.labels?.map((x: any) => x.name) ?? [],
    linearIds: {
      creatorId: linearEvent.data.creatorId,
      labelIds: linearEvent.data.labelIds ?? [],
      issueId: linearEvent.data.id,
      teamId: linearEvent.data.team?.id,
      projectId: linearEvent.data.project?.id,
      assigneeId: linearEvent.data.assignee?.id,
      subscriberIds: linearEvent.data.subscriberIds,
    },
    targets: {
      issue: { id: linearEvent.data.id },
    },
  } satisfies Omit<IssueCreated, 'conversationId' | 'userId'>

  const { conversationId, userId } = await getUserAndConversation({
    linearIssueId: linearEvent.data.id,
    linearUserId: linearEvent.data.creatorId,
    integrationId: ctx.integrationId,
    client,
  })

  await client.createEvent({
    type: 'issueCreated',
    payload: { ...payload, conversationId, userId },
  })

  // TODO: replace proper IDs and names with the actual values in the URL and payload
  const url = 'https://linear.app/botpress/issue/$ID/$NAME'
  await client.createEvent({
    type: 'issuexcreated',
    payload: {
      id: linearEvent.data.id,
      createdAt: linearEvent.data.createdAt,
      updatedAt: linearEvent.data.updatedAt,
      identifier: linearEvent.data.id,
      number: linearEvent.data.number,
      priority: linearEvent.data.priority,
      title: linearEvent.data.title,
      url,
      description: linearEvent.data.description,
      estimate: undefined, // not available in the event
    },
  })
}

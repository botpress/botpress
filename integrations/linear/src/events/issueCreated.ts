import { LinearIssueEvent } from '../misc/linear'
import { getUserAndConversation } from '../misc/utils'
import * as bp from '.botpress'

type IssueProps = {
  linearEvent: LinearIssueEvent
  client: bp.Client
  ctx: bp.Context
}

type IssueCreated = bp.events.issueCreated.IssueCreated

export const fireIssueCreated = async ({ linearEvent, client, ctx }: IssueProps) => {
  const payload: Omit<IssueCreated, 'conversationId' | 'userId'> = {
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
  }

  const { conversationId, userId } = await getUserAndConversation({
    linearIssueId: linearEvent.data.id,
    linearUserId: linearEvent.data.creatorId,
    integrationId: ctx.integrationId,
    client,
    ctx,
  })

  await client.createEvent({
    type: 'issueCreated',
    payload: { ...payload, conversationId, userId },
  })
}

import { IntegrationContext } from '@botpress/sdk'
import { LinearIssueEvent } from '../misc/linear'
import { getUserAndConversation } from '../misc/utils'
import * as bp from '.botpress'
import { Client } from '.botpress'

type IssueProps = {
  linearEvent: LinearIssueEvent
  client: Client
  ctx: IntegrationContext<bp.configuration.Configuration>
}

type IssueUpdated = bp.events.issueUpdated.IssueUpdated

export const fireIssueUpdated = async ({ linearEvent, client, ctx }: IssueProps) => {
  const payload: Omit<IssueUpdated, 'conversationId' | 'userId'> = {
    title: linearEvent.data.title,
    priority: linearEvent.data.priority,
    status: linearEvent.data.state.name,
    description: linearEvent.data.description,
    number: linearEvent.data.number,
    updatedAt: linearEvent.data.updatedAt,
    createdAt: linearEvent.data.createdAt,
    teamKey: linearEvent.data.team?.key,
    teamName: linearEvent.data.team?.name,
    labels: linearEvent.data.labels?.map((x) => x.name) ?? [],
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
    forceUpdate: true,
    client,
  })

  await client.createEvent({
    type: 'issueUpdated',
    payload: { ...payload, conversationId, userId },
  })
}

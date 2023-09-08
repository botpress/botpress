import { IssueUpdated } from '../definitions/events'

import { getUserAndConversation } from '../misc/utils'
import { Client } from '.botpress'

export const fireIssueUpdated = async ({ linearEvent, client }: { linearEvent: any; client: Client }) => {
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
  } satisfies Omit<IssueUpdated, 'conversationId' | 'userId'>

  const { conversationId, userId } = await getUserAndConversation(
    {
      linearIssueId: linearEvent.data.id,
      linearUserId: linearEvent.data.creatorId,
    },
    client
  )

  await client.createEvent({
    type: 'issueUpdated',
    payload: { ...payload, conversationId, userId },
  })
}

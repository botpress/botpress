import { getIssueFromId } from 'src/actions/get-issue'
import { LinearIssueEvent } from '../misc/linear'
import { getLinearClient, getUserAndConversation } from '../misc/utils'
import * as bp from '.botpress'

type IssueProps = {
  linearEvent: LinearIssueEvent
  client: bp.Client
  ctx: bp.Context
}

type IssueCreated = bp.events.issueCreated.IssueCreated

export const fireIssueCreated = async ({ linearEvent, client, ctx }: IssueProps) => {
  const linear = await getLinearClient({ client, ctx }, ctx.integrationId)

  const payload: Omit<IssueCreated, 'conversationId' | 'userId'> = {
    ...(await getIssueFromId(linear, linearEvent.data.id)),
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

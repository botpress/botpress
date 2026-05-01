import { LinearIssueEvent } from '../misc/linear'
import * as bp from '.botpress'

type IssueProps = {
  linearEvent: LinearIssueEvent
  client: bp.Client
  ctx: bp.Context
}

export const fireIssueDeleted = async ({ linearEvent, client }: IssueProps) => {
  await client.createEvent({
    type: 'issueDeleted',
    payload: {
      id: linearEvent.data.id,
      title: linearEvent.data.title,
      identifier: linearEvent.data.identifier,
      url: linearEvent.data.url,
      priority: linearEvent.data.priority,
      status: linearEvent.data.state.name,
      statusColor: linearEvent.data.state.color,
      statusType: linearEvent.data.state.type,
      description: linearEvent.data.description ?? '',
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
    },
  })
}

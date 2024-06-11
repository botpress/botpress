import { LinearIssueEvent } from '../misc/linear'
import * as bp from '.botpress'

type IssueProps = {
  linearEvent: LinearIssueEvent
  client: bp.Client
  ctx: bp.Context
}

export const fireIssueCreated = async ({ linearEvent, client }: IssueProps) => {
  // TODO: replace proper IDs and names with the actual values in the URL and payload
  const url = 'https://linear.app/botpress/issue/$ID/$NAME'
  await client.createEvent({
    type: 'issueCreated',
    payload: {
      item: {
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
    },
  })
}

import { IntegrationContext } from '@botpress/sdk'
import { LinearIssueEvent } from '../misc/linear'
import * as bp from '.botpress'
import { Client } from '.botpress'

type IssueProps = {
  linearEvent: LinearIssueEvent
  client: Client
  ctx: IntegrationContext<bp.configuration.Configuration>
}

export const fireIssueUpdated = async ({ linearEvent, client }: IssueProps) => {
  // TODO: replace proper IDs and names with the actual values in the URL and payload
  const url = 'https://linear.app/botpress/issue/$ID/$NAME'
  await client.createEvent({
    type: 'issueUpdated',
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

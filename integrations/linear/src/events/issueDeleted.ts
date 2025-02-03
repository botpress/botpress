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
    },
  })
}

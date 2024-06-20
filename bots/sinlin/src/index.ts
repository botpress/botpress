/* eslint-disable unused-imports/no-unused-vars */
import { Client } from '@botpress/client'
import { bot, EventHandlerProps, IssueState, MessageHandlerProps } from './bot'
import { EventEmitter } from './event-emitter'
import { DataSource, Syncer } from './sync'
import * as bp from '.botpress'

const getBlankClient = (props: EventHandlerProps | MessageHandlerProps): Client =>
  (props.client as any).client as Client

type LinearIssue = bp.fleurLinear.entities.issue.Issue
type IssueEvents = {
  created: { event: { item: LinearIssue }; state: IssueState }
  updated: { event: { item: LinearIssue }; state: IssueState }
  deleted: { event: { item: LinearIssue }; state: IssueState }
}

class LinearIssueSource extends EventEmitter<IssueEvents> implements DataSource<LinearIssue> {
  public constructor(private props: EventHandlerProps) {
    super()
  }

  public async list(input: {
    nextToken?: string | undefined
  }): Promise<{ items: LinearIssue[]; meta: { nextToken?: string | undefined } }> {
    const { output } = await this.props.client.callAction({
      type: 'fleur/linear:issueList',
      input,
    })
    return output
  }
}

const TABLE_NAME = 'linear-issues'

bot.event(async (props) => {
  const dataSource = new LinearIssueSource(props)
  const blankClient = getBlankClient(props)
  const syncer = new Syncer<LinearIssue>(dataSource, blankClient, { tableName: TABLE_NAME })

  const {
    state: { payload: state },
  } = await props.client.getOrSetState({
    type: 'bot',
    name: 'issue',
    id: props.ctx.botId,
    payload: {
      nextToken: undefined,
      tableCreated: false,
    },
  })

  if (props.event.type === 'syncIssues') {
    const newState = await syncer.sync(state)
    await props.client.setState({
      type: 'bot',
      name: 'issue',
      id: props.ctx.botId,
      payload: newState,
    })
    return
  }

  if (props.event.type === 'fleur/linear:issueCreated') {
    dataSource.emit('created', { event: { item: props.event.payload.item }, state })
    return
  }

  if (props.event.type === 'fleur/linear:issueUpdated') {
    dataSource.emit('updated', { event: { item: props.event.payload.item }, state })
    return
  }
})

bot.message(async (props) => {
  const { conversation, message, ctx } = props
  if (conversation.integration !== 'telegram') {
    console.info(`Ignoring message from ${conversation.integration}`)
    return
  }

  const blankClient = getBlankClient(props)

  if (message.type === 'text' && message.payload.text === '/list') {
    const { rows } = await blankClient.findTableRows({
      table: TABLE_NAME,
    })

    const issues: string[] = rows.map(({ computed, stale, similarity, ...r }) =>
      Object.entries(r)
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ')
    )

    const response = issues.join('\n')

    await props.client.createMessage({
      type: 'text',
      payload: {
        text: response,
      },
      conversationId: message.conversationId,
      userId: ctx.botId,
      tags: {},
    })
  }
})

export default bot

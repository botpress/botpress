/* eslint-disable unused-imports/no-unused-vars */
import { Client } from '@botpress/client'
import { bot, EventHandlerProps, IssueState, MessageHandlerProps } from './bot'
import { EventEmitter } from './event-emitter'
import { DataSource, Syncer } from './sync'
import * as bp from '.botpress'

const initialState: IssueState = { nextToken: undefined, tableCreated: false }

const getBlankClient = (props: EventHandlerProps | MessageHandlerProps): Client =>
  (props.client as any).client as Client

const reply = async (props: MessageHandlerProps, text: string) => {
  await props.client.createMessage({
    type: 'text',
    payload: {
      text,
    },
    conversationId: props.message.conversationId,
    userId: props.ctx.botId,
    tags: {},
  })
}

const getIssueState = async (props: EventHandlerProps | MessageHandlerProps): Promise<IssueState> => {
  const {
    state: { payload: state },
  } = await props.client.getOrSetState({
    type: 'bot',
    name: 'issue',
    id: props.ctx.botId,
    payload: initialState,
  })
  return state
}

const setIssueState = async (props: EventHandlerProps | MessageHandlerProps, state: IssueState) => {
  await props.client.setState({
    type: 'bot',
    name: 'issue',
    id: props.ctx.botId,
    payload: state,
  })
}

type LinearIssue = bp.linear.entities.issue.Issue
type IssueEvents = {
  created: { event: { item: LinearIssue }; state: IssueState }
  updated: { event: { item: LinearIssue }; state: IssueState }
  deleted: { event: { item: LinearIssue }; state: IssueState }
}

class LinearIssueSource extends EventEmitter<IssueEvents> implements DataSource<LinearIssue> {
  public constructor(private props: EventHandlerProps | MessageHandlerProps) {
    super()
  }

  public async list(input: {
    nextToken?: string | undefined
  }): Promise<{ items: LinearIssue[]; meta: { nextToken?: string | undefined } }> {
    const { output } = await this.props.client.callAction({
      type: 'linear:issueList',
      input,
    })
    return output
  }
}

const TABLE_NAME = 'linearIssuesTable'

const sync = async (
  props: EventHandlerProps | MessageHandlerProps,
  dataSource: LinearIssueSource,
  state: IssueState
) => {
  const blankClient = getBlankClient(props)
  const syncer = new Syncer<LinearIssue>(dataSource, blankClient, { tableName: TABLE_NAME })

  const newState = await syncer.sync(state)
  await setIssueState(props, newState)
}

bot.event(async (props) => {
  const dataSource = new LinearIssueSource(props)
  const state = await getIssueState(props)

  if (props.event.type === 'syncIssues') {
    await sync(props, dataSource, state)
    return
  }

  if (props.event.type === 'linear:issueCreated') {
    // TODO: uncomment this line once linear implements the creatable interface
    // dataSource.emit('created', { event: { item: props.event.payload.item }, state })
    return
  }

  if (props.event.type === 'linear:issueUpdated') {
    // TODO: uncomment this line once linear implements the updatable interface
    // dataSource.emit('updated', { event: { item: props.event.payload.item }, state })
    return
  }
})

bot.message(async (props) => {
  const { conversation, message } = props
  if (conversation.integration !== 'telegram') {
    console.info(`Ignoring message from ${conversation.integration}`)
    return
  }

  if (message.type !== 'text') {
    await reply(props, 'I only understand text messages')
    return
  }

  const blankClient = getBlankClient(props)
  const dataSource = new LinearIssueSource(props)

  const state = await getIssueState(props)

  if (message.payload.text === '/sync') {
    await sync(props, dataSource, state)
    await reply(props, 'Issues synced')
    return
  }

  if (message.payload.text === '/list') {
    if (!state.tableCreated) {
      await reply(props, 'Table does not exist')
      return
    }
    const { rows } = await blankClient.findTableRows({
      table: TABLE_NAME,
      filter: {},
      limit: 10,
    })

    const issues: string[] = rows.map(({ computed, stale, similarity, ...r }) =>
      Object.entries(r)
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ')
    )

    const response = issues.join('\n') || 'No issues found'
    const summary = response.length > 1000 ? response.substring(0, 500) + '...' : response

    await reply(props, summary)
    return
  }

  if (message.payload.text === '/clear') {
    if (!state.tableCreated) {
      await reply(props, 'Table does not exist')
      return
    }

    await blankClient.deleteTable({ table: TABLE_NAME })
    await reply(props, 'Table cleared')

    await setIssueState(props, { ...state, tableCreated: false })
    return
  }

  await reply(props, 'What do you want ?')
})

export default bot

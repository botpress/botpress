import { Client } from '@botpress/client'
import * as bp from '.botpress'

const { tableName } = bp.synchronizer.configuration

const getBlankClient = (props: bp.EventHandlerProps | bp.MessageHandlerProps): Client =>
  (props.client as any)._client as Client

const summarize = (str: string, maxLength: number = 1000): string =>
  str.length > maxLength ? str.substring(0, maxLength) + '...' : str

const reply = async (props: bp.MessageHandlerProps, text: string) => {
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

const bot = new bp.Bot({ actions: {} })

type Command = {
  description: string
  handler: bp.MessageHandlers['*']
}
const commands: Record<string, Command> = {
  '/sync': {
    description: 'Sync issues',
    handler: async (props: bp.MessageHandlerProps) => {
      await bot.actionHandlers.synchronize({ ...props, input: {} })
      await reply(props, 'Issues synced')
    },
  },
  '/list': {
    description: 'List issues',
    handler: async (props: bp.MessageHandlerProps) => {
      const tableState = await props.client
        .getOrSetState({ type: 'bot', id: props.ctx.botId, name: 'table', payload: { tableCreated: false } })
        .then((r) => r.state.payload)

      if (!tableState.tableCreated) {
        await reply(props, 'Table does not exist')
        return
      }

      const { rows } = await getBlankClient(props).findTableRows({
        table: tableName,
        filter: {},
        limit: 10,
      })

      const issues: string[] = rows
        .map(({ computed: _computed, stale: _stale, similarity: _similarity, ...r }) =>
          Object.entries(r)
            .map(([k, v]) => `${k}: ${v}`)
            .join('; ')
        )
        .map((r) => `- ${r}`)

      const response = issues.join('\n\n') || 'No issues found'
      await reply(props, summarize(response))
    },
  },
  '/clear': {
    description: 'Clear issues',
    handler: async (props: bp.MessageHandlerProps) => {
      await bot.actionHandlers.clear({ ...props, input: {} })
      await reply(props, 'Table cleared')
    },
  },
}

bot.on.message('*', async (props) => {
  const { message } = props

  if (message.type !== 'text') {
    await reply(props, 'I only understand text messages')
    return
  }

  const query = message.payload.text.trim()
  const command = commands[query]
  if (command) {
    const now = Date.now()
    props.logger.info(`[${now}:START] command "${query}"`)
    await command.handler(props)
    props.logger.info(`[${now}:STOP] command "${query}"`)
    return
  }

  const helpMessage = Object.entries(commands)
    .map(([cmd, { description }]) => `${cmd}: ${description}`)
    .join('\n')
  await reply(props, 'Please use one of the following commands:\n' + helpMessage)
})

export default bot

import * as table from './table'
import * as vanilla from './vanilla-client'
import * as bp from '.botpress'

const synchronize = async (props: bp.EventHandlerProps | bp.ActionHandlerProps): Promise<{ nextToken?: string }> => {
  const { state } = await props.client.getOrSetState({
    type: 'bot',
    id: props.ctx.botId,
    name: 'job',
    payload: { nextToken: undefined },
  })

  const { nextToken } = state.payload
  props.logger.info('Synchronizing...', nextToken)

  const { client, configuration, actions } = props

  const nextPage = await actions.listable.list({ nextToken })

  await table.createTableIfNotExist(props, nextPage.items[0])

  await vanilla.clientFrom(client).upsertTableRows({
    table: configuration.tableName,
    rows: nextPage.items.map(table.escapeObject),
    keyColumn: table.PRIMARY_KEY,
  })

  await props.client.setState({
    type: 'bot',
    id: props.ctx.botId,
    name: 'job',
    payload: { nextToken: nextPage.meta.nextToken },
  })

  return { nextToken: nextPage.meta.nextToken }
}

const plugin = new bp.Plugin({
  actions: {
    synchronize: async (props) => {
      const { nextToken } = await synchronize(props)
      return { itemsLeft: !!nextToken }
    },
    clear: async (props) => {
      await table.deleteTableIfExist(props)
      return {}
    },
  },
})

plugin.on.event('listItems', async (props) => {
  await synchronize(props)
})

export default plugin

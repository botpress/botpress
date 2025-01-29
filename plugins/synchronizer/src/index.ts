import * as error from './error'
import * as table from './table'
import * as vanilla from './vanilla-client'
import * as bp from '.botpress'

const synchronize = async (props: bp.EventHandlerProps | bp.ActionHandlerProps): Promise<{ nextToken?: string }> => {
  const { state } = await props.client
    .getOrSetState({
      type: 'bot',
      id: props.ctx.botId,
      name: 'job',
      payload: { nextToken: undefined },
    })
    .catch(error.mapError('Failed to get state "job"'))

  const { nextToken } = state.payload
  props.logger.info('Synchronizing...', nextToken)

  const { client, configuration, actions } = props

  const nextPage = await actions.listable.list({ nextToken }).catch(error.mapError('Failed to list items'))

  await table.createTableIfNotExist(props, nextPage.items[0]).catch(error.mapError('Failed to create table'))

  await vanilla
    .clientFrom(client)
    .upsertTableRows({
      table: configuration.tableName,
      rows: nextPage.items.map(table.escapeObject),
      keyColumn: table.PRIMARY_KEY,
    })
    .catch(error.mapError('Failed to upsert table rows'))

  await props.client
    .setState({
      type: 'bot',
      id: props.ctx.botId,
      name: 'job',
      payload: { nextToken: nextPage.meta.nextToken },
    })
    .catch(error.mapError('Failed to set state "job"'))

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
  const { event, logger } = props
  logger.info(`### Event "${event.type}"`, event.payload)
  await synchronize(props)
})

plugin.on.event('rowDeleted', async (props) => {
  const { actions, event, logger } = props
  logger.info(`### Event "${event.type}"`, event.payload)
  await actions.deletable.delete({ id: props.event.payload.row.id })
})

plugin.on.event('deletable:deleted', async (props) => {
  const { client, configuration, event, logger } = props
  logger.info(`### Event "${event.type}"`, event.payload)
  await vanilla.clientFrom(client).deleteTableRows({
    table: configuration.tableName,
    filter: { [table.PRIMARY_KEY]: { $eq: props.event.payload.id } },
  })
})

export default plugin

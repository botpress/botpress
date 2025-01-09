import { Client } from '@botpress/client'
import * as esc from './escape'
import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

const getVanillaClient = (client: bp.Client): Client => {
  // TODO: add table methods on vanilla client
  return (client as any)._client
}

plugin.on.event('creatable:created', async ({ client, event, configuration }) => {
  await getVanillaClient(client).upsertTableRows({
    table: configuration.tableName,
    rows: [esc.escapeObject(event.payload.item)],
    keyColumn: esc.PRIMARY_KEY,
  })
})

plugin.on.event('updatable:updated', async ({ client, event, configuration }) => {
  await getVanillaClient(client).upsertTableRows({
    table: configuration.tableName,
    rows: [esc.escapeObject(event.payload.item)],
    keyColumn: esc.PRIMARY_KEY,
  })
})

plugin.on.event('deletable:deleted', async ({ client, event, configuration }) => {
  await getVanillaClient(client).deleteTableRows({
    table: configuration.tableName,
    filter: { [esc.PRIMARY_KEY]: { $eq: event.id } },
  })
})

plugin.on.event('listItems', async ({ client, event, configuration, actions }) => {
  const _nextPage = await actions.listable.list({ nextToken: event.payload.nextToken })
  await getVanillaClient(client).upsertTableRows({
    table: configuration.tableName,
    rows: _nextPage.items.map(esc.escapeObject),
    keyColumn: esc.PRIMARY_KEY,
  })
})

plugin.on.event('rowInserted', async ({ event, actions }) => {
  await actions.creatable.create({ item: event.payload.item })
})

plugin.on.event('rowUpdated', async ({ event, actions }) => {
  await actions.updatable.update({ id: event.payload.item.id, item: event.payload.item })
})

plugin.on.event('rowDeleted', async ({ event, actions }) => {
  await actions.deletable.delete({ id: event.payload.item.id })
})

export default plugin

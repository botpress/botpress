import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

plugin.on.event('creatable:created', async ({}) => {
  // insert in botpress table here
})

plugin.on.event('updatable:updated', async ({}) => {
  // update in botpress table here
})

plugin.on.event('deletable:deleted', async ({}) => {
  // delete in botpress table here
})

plugin.on.event('listItems', async ({ actions, event }) => {
  const _nextPage = await actions.listable.list({ nextToken: event.payload.nextToken })
  // upsert nextPage in botpress table here
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

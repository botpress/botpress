import { IntegrationDefinition, z } from '@botpress/sdk'

import creatable from './bp_modules/creatable'
import deletable from './bp_modules/deletable'
import filesReadonly from './bp_modules/files-readonly'
import readable from './bp_modules/readable'
import updatable from './bp_modules/updatable'
import { entities } from './definitions'

export default new IntegrationDefinition({
  name: 'confluence',
  version: '3.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  title: 'Confluence',
  description: 'Manage your files and folders effortlessly.',
  configuration: {
    schema: z.object({
      host: z.string().describe('Host URI. Format is https://your_workspace_name.atlassian.net').title('Host'),
      user: z.string().describe('Email of the user').title('User Email'),
      apiToken: z.string().describe('API Token').title('API Token'),
      webhookUrl: z.string().describe('The url to post the bot answers to.').title('Webhook URL'),
    }),
  },
  actions: {},
  entities,
  channels: {
    comment: {
      title: 'Comments',
      description: 'Comments on pages',
      conversation: {
        tags: {
          id: { title: 'Conversation ID', description: 'The ID of the conversation in confluence' },
        },
      },
      messages: {
        text: {
          schema: z.object({
            text: z.string(),
          }),
        },
      },
    },
  },
  user: {
    tags: {
      id: { title: 'User ID', description: 'The ID of the user in confluence' },
    },
  },
})
  .extend(readable, ({ entities }) => ({
    entities: { item: entities.page },
    actions: { read: { name: 'getPage' } },
  }))
  .extend(creatable, ({ entities }) => ({
    entities: { item: entities.page },
    actions: { create: { name: 'createPage' } },
    events: { created: { name: 'pageCreated' } },
  }))
  .extend(updatable, ({ entities }) => ({
    entities: { item: entities.page },
    actions: { update: { name: 'updatePage' } },
    events: { updated: { name: 'pageUpdated' } },
  }))
  .extend(deletable, ({ entities }) => ({
    entities: { item: entities.page },
    actions: { delete: { name: 'deletePage' } },
    events: { deleted: { name: 'pageDeleted' } },
  }))
  .extend(filesReadonly, ({}) => ({
    entities: {},
    actions: {
      listItemsInFolder: { name: 'filesReadonlyListItemsInFolder' },
      transferFileToBotpress: { name: 'filesReadonlyTransferFileToBotpress' },
    },
  }))

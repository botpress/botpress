import * as sdk from '@botpress/sdk'

import creatable from './bp_modules/creatable'
import deletable from './bp_modules/deletable'
import filesReadonly from './bp_modules/files-readonly'
import readable from './bp_modules/readable'
import updatable from './bp_modules/updatable'
import { entities } from './definitions'

export default new sdk.IntegrationDefinition({
  name: 'confluence',
  version: '3.2.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  title: 'Confluence',
  description: 'Manage your files and folders effortlessly.',
  configuration: {
    schema: sdk.z.object({
      host: sdk.z.string().describe('Host URI. Format is https://your_workspace_name.atlassian.net').title('Host'),
      user: sdk.z.string().describe('Email of the user').title('User Email'),
      apiToken: sdk.z.string().describe('API Token').title('API Token'),
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
          schema: sdk.z.object({
            text: sdk.z.string(),
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
      listItemsInFolder: {
        name: 'filesReadonlyListItemsInFolder',
        attributes: { ...sdk.WELL_KNOWN_ATTRIBUTES.HIDDEN_IN_STUDIO },
      },
      transferFileToBotpress: {
        name: 'filesReadonlyTransferFileToBotpress',
        attributes: { ...sdk.WELL_KNOWN_ATTRIBUTES.HIDDEN_IN_STUDIO },
      },
    },
  }))

import * as sdk from '@botpress/sdk'
import filesReadonly from './bp_modules/files-readonly'
import { actions, configuration, configurations, identifier, secrets, states, user } from './definitions'

export default new sdk.IntegrationDefinition({
  name: 'notion',
  description: 'Add pages and comments, manage databases, and engage in discussions — all within your chatbot.',
  title: 'Notion',
  version: '2.2.0',
  icon: 'icon.svg',
  readme: 'hub.md',
  actions,
  configuration,
  configurations,
  identifier,
  secrets,
  states,
  user,
}).extend(filesReadonly, ({}) => ({
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

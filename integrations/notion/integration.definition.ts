import * as sdk from '@botpress/sdk'
import filesReadonly from './bp_modules/files-readonly'
import { actions, configuration, configurations, identifier, secrets, states, user } from './definitions'

export const INTEGRATION_NAME = 'notion'
export const INTEGRATION_VERSION = '2.2.2'

export default new sdk.IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: INTEGRATION_VERSION,
  title: 'Notion',
  description: 'Add pages and comments, manage databases, and engage in discussions — all within your chatbot.',
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

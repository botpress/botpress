import { posthogHelper } from '@botpress/common'
import { IntegrationDefinition } from '@botpress/sdk'
import proactiveConversation from 'bp_modules/proactive-conversation'
import deletable from './bp_modules/deletable'
import listable from './bp_modules/listable'

import { actions, channels, events, configuration, configurations, user, states, entities } from './definitions'

export const INTEGRATION_NAME = 'linear'
export const INTEGRATION_VERSION = '2.0.0'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: INTEGRATION_VERSION,
  title: 'Linear',
  description:
    'Manage your projects autonomously. Have your bot participate in discussions, manage issues and teams, and track progress.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration,
  configurations,
  channels,
  identifier: {
    extractScript: 'extract.vrl',
  },
  user,
  actions,
  events,
  states,
  entities,
  secrets: {
    CLIENT_ID: {
      description: 'The client ID of your Linear OAuth app.',
    },
    CLIENT_SECRET: {
      description: 'The client secret of your Linear OAuth app.',
    },
    WEBHOOK_SIGNING_SECRET: {
      description: 'The signing secret of your Linear webhook.',
    },
    ...posthogHelper.COMMON_SECRET_NAMES,
  },
})
  .extend(listable, ({ entities }) => ({
    entities: { item: entities.issue },
    actions: {
      list: { name: 'issueList' },
    },
  }))
  .extend(deletable, ({ entities }) => ({
    entities: { item: entities.issue },
    actions: {
      delete: { name: 'issueDelete' },
    },
    events: {
      deleted: { name: 'issueDeleted' },
    },
  }))
  .extend(proactiveConversation, ({ entities }) => ({
    entities: {
      conversation: entities.issueConversation,
    },
    actions: { getOrCreateConversation: { name: 'getOrCreateIssueConversation' } },
  }))

import { IntegrationDefinition } from '@botpress/sdk'

import { configuration, states, user, channels, actions } from './src/definitions'

export default new IntegrationDefinition({
  name: 'jira',
  title: 'Jira',
  description:
    'This integration allows you to work with your Jira workspace, users, projects, and workflow transitions.',
  version: '0.3.0',
  readme: 'readme.md',
  icon: 'icon.svg',
  configuration,
  channels,
  user,
  actions,
  events: {},
  states,
  attributes: {
    category: 'Project Management',
    repo: 'botpress',
  },
})

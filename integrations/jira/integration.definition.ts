import { IntegrationDefinition } from '@botpress/sdk'

import { configuration, states, secrets, user, channels, actions } from './src/definitions'

export default new IntegrationDefinition({
  name: 'jira',
  title: 'Jira',
  description:
    'This integration allows you to work with your Jira workspace, users, projects, and workflow transitions.',
  version: '0.5.1',
  readme: 'readme.md',
  icon: 'icon.svg',
  configuration,
  channels,
  user,
  actions,
  events: {},
  states,
  secrets,
  attributes: {
    category: 'Project Management',
    repo: 'botpress',
  },
})

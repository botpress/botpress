/* bplint-disable */
import { IntegrationDefinition } from '@botpress/sdk'
import { actionDefinitions } from 'src/definitions/actions'

export default new IntegrationDefinition({
  name: 'charts',
  description: 'Easily generate a variety of charts, including line, bar, pie, and scatter plots, etc.',
  version: '0.2.2',
  readme: 'hub.md',
  icon: 'icon.svg',
  actions: actionDefinitions,
  secrets: {
    QUICKCHARTS_API_KEY: {},
  },
})

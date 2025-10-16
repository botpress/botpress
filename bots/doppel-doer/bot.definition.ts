/* bplint-disable */ // zui `toTypescriptSchema` does not preserve title and description properties
import * as sdk from '@botpress/sdk'
import * as genenv from './.genenv'
import todoist from './bp_modules/todoist'

export default new sdk.BotDefinition({
  configuration: {
    schema: sdk.z.object({}),
  },
  states: {},
  events: {},
  recurringEvents: {},
  user: {},
  conversation: {},
  __advanced: {
    useLegacyZuiTransformer: true,
  },
})
  .addIntegration(todoist, {
    alias: 'todoist-src',
    enabled: true,
    configurationType: 'apiToken',
    configuration: { apiToken: genenv.TODOIST_SRC_API_TOKEN },
  })
  .addIntegration(todoist, {
    alias: 'todoist-dst',
    enabled: true,
    configurationType: 'apiToken',
    configuration: { apiToken: genenv.TODOIST_DST_API_TOKEN },
  })

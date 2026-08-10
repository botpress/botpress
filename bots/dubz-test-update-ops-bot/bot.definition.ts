import * as sdk from '@botpress/sdk'
import testUpdateOps from './bp_modules/test-update-ops'

export default new sdk.BotDefinition({}).addIntegration(testUpdateOps, {
  enabled: true,
  configuration: {},
})

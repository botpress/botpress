import * as sdk from '@botpress/sdk'
import whatsapp from './bp_modules/whatsapp'

export default new sdk.BotDefinition({}).add(whatsapp, {
  enabled: true,
  configurationType: null,
  configuration: {},
})

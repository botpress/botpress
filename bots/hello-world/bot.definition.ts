import * as sdk from '@botpress/sdk'
import whatsapp from '@botpresshub/whatsapp/integration.definition'

export default new sdk.BotDefinition({}).add(whatsapp, {
  enabled: true,
  configurationType: null,
  configuration: {},
})

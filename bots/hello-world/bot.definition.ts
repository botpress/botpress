import * as sdk from '@botpress/sdk'
import whatsapp from '@botpresshub/whatsapp/integration.definition'

const whatsappPkg = {
  type: 'integration',
  definition: whatsapp,
} satisfies sdk.IntegrationPackage

export default new sdk.BotDefinition({}).add(whatsappPkg, {
  enabled: true,
  configurationType: null,
  configuration: {},
})

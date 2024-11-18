import * as sdk from '@botpress/sdk'
import webhook from './bp_modules/webhook'
import whatsapp from './bp_modules/whatsapp'

export default new sdk.BotDefinition({
  actions: {
    sayHello: {
      title: 'Say Hello',
      description: 'Says hello to the caller',
      input: {
        schema: sdk.z.object({ name: sdk.z.string().optional() }),
      },
      output: {
        schema: sdk.z.object({ message: sdk.z.string() }),
      },
    },
  },
})
  .add(whatsapp, {
    enabled: true,
    configuration: {},
  })
  .add(webhook, {
    enabled: true,
    configuration: {},
  })

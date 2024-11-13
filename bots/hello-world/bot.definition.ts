import * as sdk from '@botpress/sdk'
import logger from './bp_modules/logger'
import webhook from './bp_modules/webhook'
import whatsapp from './bp_modules/whatsapp'

export default new sdk.BotDefinition({})
  .add(whatsapp, {
    enabled: true,
    configuration: {},
  })
  .add(webhook, {
    enabled: true,
    configuration: {},
  })
  .use(logger)

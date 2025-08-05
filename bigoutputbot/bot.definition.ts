import { BotDefinition, z } from '@botpress/sdk'
import bigoutput from 'bp_modules/bigoutput'
import telegram from 'bp_modules/telegram'

export default new BotDefinition({
  events: { big: { schema: z.object({}) } },
  // recurringEvents: { bigAuto: { payload: {}, schedule: { cron: '* * * * *' }, type: 'big' } },
})
  .addIntegration(bigoutput, { configuration: {}, enabled: true })
  .addIntegration(telegram, {
    configuration: { botToken: '8369376129:AAGikav_kZ13A1kuL09FVp8jwyemSGw4QpY' },
    enabled: true,
  })

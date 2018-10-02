import retry from 'bluebird-retry'
import moment from 'moment'

import { SDK } from '.'
import ScopedNlu from './scopednlu'

export default async (bp: SDK) => {
  const botScopedNlu: Map<string, ScopedNlu> = new Map<string, ScopedNlu>()

  const bots = await bp.bots.getAllBots()

  for (const [id] of bots) {
    // if (!bot.isMiddlewareEnabled('nlu')) {
    //  return
    // }

    const scoped = new ScopedNlu(bp, id)
    await scoped.initialize()

    botScopedNlu.set(id, scoped)
  }

  function forBot(botId): ScopedNlu {
    return botScopedNlu.get(botId)
  }

  async function processEvent(event) {
    if (['session_reset', 'bp_dialog_timeout'].includes(event.type)) {
      return
    }

    const botCtx = forBot(event.botId)
    if (!botCtx) {
      return
    }

    const previous = JSON.parse((await bp.kvs.get(event.botId, 'nlu/requestsLimit')) || '{}')
    const hour = moment().startOf('hour')
    const requestsCount = hour.isSame(previous.hour) ? previous.requestsCount : 0

    await bp.kvs.set(event.botId, 'nlu/requestsLimit', JSON.stringify({ hour, requestsCount: requestsCount + 1 }))

    const maximumRequestsPerHour = parseFloat(botCtx.config.maximumRequestsPerHour)
    if (requestsCount > maximumRequestsPerHour) {
      throw new Error(
        `[NLU] Requests limit per hour exceeded: ${maximumRequestsPerHour} allowed ` +
          `while getting ${requestsCount}. You can set higher value to NLU_MAX_REQUESTS_PER_HOUR.`
      )
    }

    let eventIntent = { confidence: undefined, name: undefined }
    let eventIntents = []

    try {
      if (botCtx.config.debugModeEnabled) {
        bp.logger.info('[NLU Extraction] ' + event.preview, event.payload)
      }

      const metadata = await retry(() => botCtx.provider.extract(event), botCtx.retryPolicy)

      if (metadata) {
        Object.assign(event, { nlu: metadata })
        eventIntent = metadata.intent
        eventIntents = metadata.intents
      }
    } catch (err) {
      bp.logger.warn('[NLU] Error extracting metadata for incoming text: ' + err.message)
    }

    const intentConfidentEnough = () => {
      const confidence = eventIntent.confidence != undefined ? eventIntent.confidence : 1
      return confidence >= botCtx.minConfidence && confidence <= botCtx.maxConfidence
    }

    if (event.nlu) {
      Object.assign(event.nlu.intent, {
        intentConfidentEnough,
        is: intentName => {
          intentName = (intentName || '').toLowerCase()
          return intentConfidentEnough() && (eventIntent.name || '').toLowerCase() === intentName
        },
        startsWith: prefix => {
          prefix = (prefix || '').toLowerCase()
          return intentConfidentEnough() && (eventIntent.name || '').toLowerCase().startsWith(prefix)
        }
      })
      Object.assign(event.nlu.intents, {
        has: intentName => {
          intentName = (intentName || '').toLowerCase()
          return !!eventIntents.find(intent => (intent.name || '').toLowerCase() === intentName)
        }
      })
    }
  }

  bp.nlu = {
    processEvent,
    forBot
  }

  bp.events.registerMiddleware({
    name: 'nlu.incoming',
    direction: 'incoming',
    handler: async (event, next) => {
      await processEvent(event)
      next()
    },
    order: 10,
    description:
      'Process natural language in the form of text. Structured data with an action and parameters for that action is injected in the incoming message event.',
    enabled: true
  })
}

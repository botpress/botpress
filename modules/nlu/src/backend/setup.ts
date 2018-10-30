import 'bluebird-global'
import retry from 'bluebird-retry'
import moment from 'moment'
import util from 'util'

import { SDK } from '.'
import ScopedNlu from './scopednlu'

export const initBot = async (bp: SDK, botScopedNlu: Map<string, ScopedNlu>, botId: string) => {
  const scoped = new ScopedNlu(bp, botId)
  await scoped.initialize()

  botScopedNlu.set(botId, scoped)
}

export const initModule = async (bp: SDK, botScopedNlu: Map<string, ScopedNlu>) => {
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

  async function processEvent(event) {
    if (['session_reset', 'bp_dialog_timeout', 'visit'].includes(event.type)) {
      return
    }

    const botCtx = botScopedNlu.get(event.botId)
    if (!botCtx) {
      return
    }

    const previous = (await bp.kvs.get(event.botId, 'nlu/requestsLimit')) || {}
    const hour = moment().startOf('hour')
    const requestsCount = hour.isSame(previous.hour) ? previous.requestsCount : 0

    await bp.kvs.set(event.botId, 'nlu/requestsLimit', { hour, requestsCount: requestsCount + 1 })

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
      const metadata = await retry(() => botCtx.provider.extract(event), botCtx.retryPolicy)

      if (metadata) {
        Object.assign(event, { nlu: metadata })
        eventIntent = metadata.intent
        eventIntents = metadata.intents

        if (botCtx.config.debugModeEnabled) {
          const debugCtx = {
            text: event.preview,
            intent: eventIntent && eventIntent.name,
            confidence: eventIntent && eventIntent.confidence,
            bot_min_confidence: botCtx.minConfidence,
            bot_max_confidence: botCtx.maxConfidence,
            is_confident_enough:
              eventIntent &&
              eventIntent.confidence >= botCtx.minConfidence &&
              eventIntent.confidence <= botCtx.maxConfidence,
            language: metadata.language || 'N/A',
            entities: metadata.entities || []
          }
          const debugStr = util.inspect(debugCtx, { colors: true, depth: 2 })
          bp.logger.debug('NLU Extraction ' + debugStr)
        }
      }
    } catch (err) {
      bp.logger.warn('Error extracting metadata for incoming text: ' + err.message)
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
}

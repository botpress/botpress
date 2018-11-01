import { NLU_PREFIX } from './providers/nlu'
import NluStorage from './providers/nlu'
import MicrosoftQnaMakerStorage from './providers/qnaMaker'
import { QnaStorage, SDK } from './qna'

export const initBot = async (bp: SDK, botScopedStorage: Map<string, QnaStorage>, botId: string) => {
  const config = await bp.config.getModuleConfigForBot('qna', botId)

  let storage = undefined
  if (config.qnaMakerApiKey) {
    storage = new MicrosoftQnaMakerStorage(bp, config)
  } else {
    storage = new NluStorage(bp, config, botId)
  }

  await storage.initialize()
  botScopedStorage.set(botId, storage)
}

export const initModule = async (bp: SDK, botScopedStorage: Map<string, QnaStorage>) => {
  bp.events.registerMiddleware({
    name: 'qna.incoming',
    direction: 'incoming',
    handler: async (event, next) => {
      if (!event.hasFlag(bp.IO.WellKnownFlags.SKIP_QNA_PROCESSING)) {
        const config = bp.config.getModuleConfigForBot('qna', event.botId)
        const storage = botScopedStorage.get(event.botId)

        if (!(await processEvent(event, { bp, storage, config }))) {
          next()
        }
      }
    },
    order: 11, // must be after the NLU middleware and before the dialog middleware
    description: 'Listen for predefined questions and send canned responses.',
    enabled: true
  })

  const processEvent = async (event, { bp, storage, config }) => {
    let answer
    if (config.qnaMakerApiKey) {
      answer = (await storage.answersOn(event.text)).pop()
      if (!answer) {
        return false
      }
      bp.logger.debug('Matched question', answer.id)
    } else {
      // NB: we rely on NLU being loaded before we receive any event.
      // I'm not sure yet if we can guarantee it
      if (!(event.nlu || {}).intent || !event.nlu.intent.startsWith(NLU_PREFIX)) {
        return false
      }

      bp.logger.debug('Matched NLU intent', event.nlu.intent.name)
      const id = event.nlu.intent.name.substring(NLU_PREFIX.length)
      answer = (await storage.getQuestion(id)).data
    }

    if (!answer.enabled) {
      bp.logger.debug('Question disabled, skipping')
      return false
    }

    if (answer.action.includes('text')) {
      bp.logger.debug('Replying to recognized question with plain text answer', answer.id)

      const payloads = await bp.cms.renderElement('builtin_text', { text: answer.answer, typing: true }, 'web')
      bp.events.replyToEvent(event, payloads)

      if (answer.action === 'text') {
        event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)
        return true
      }
    }

    if (answer.action.includes('redirect')) {
      bp.logger.debug('Replying to recognized question with redirect', answer.id)

      const sessionId = await bp.dialog.createId(event)
      await bp.dialog.jumpTo(sessionId, event, answer.redirectFlow, answer.redirectNode)
      // We return false here because the we only jump to the right flow/node and let
      // the bot's natural middleware chain take care of processing the message the normal way
      return false
    }
  }
}

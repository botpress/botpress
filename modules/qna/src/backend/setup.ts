import { NLU_PREFIX } from './providers/nlu'
import NluStorage from './providers/nlu'
import MicrosoftQnaMakerStorage from './providers/qnaMaker'
import { QnaStorage, SDK } from './qna'

export default async (bp: SDK, botScopedStorage: Map<string, QnaStorage>) => {
  const initialize = async () => {
    const bots = await bp.bots.getAllBots()
    for (const [id] of bots) {
      const config = await bp.config.getModuleConfigForBot('qna', id)

      let storage = undefined
      if (config.qnaMakerApiKey) {
        storage = new MicrosoftQnaMakerStorage(bp, config)
      } else {
        storage = new NluStorage(bp, config, id)
      }

      await storage.initialize()
      botScopedStorage.set(id, storage)
    }
  }

  const registerMiddleware = async () => {
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
  }

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
      // TODO: This is used as the `stateId` by the bot template
      // Not sure if it's universal enough for every use-case but
      // I don't see a better alternative as of now
      // const stateId = event.sessionId || event.user.id
      // bp.logger.debug(`Jumping ${stateId} to ${answer.redirectFlow} ${answer.redirectNode}`)

      // TODO jump to correct location
      // console.log(event.botId, event.target, answer.redirectFlow, answer.redirectNode)

      await bp.dialog.jumpTo(event, answer.redirectFlow, answer.redirectNode)
      // We return false here because the we only jump to the right flow/node and let
      // the bot's natural middleware chain take care of processing the message the normal way
      return false
    }
  }

  initialize()
  registerMiddleware()
}

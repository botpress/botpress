import { NLU_PREFIX } from './providers/nlu'
import { SDK } from './types'

export default async (bp: SDK, config) => {
  const registerMiddleware = async () => {
    bp.events.registerMiddleware({
      name: 'qna.incoming',
      direction: 'incoming',
      handler: async (event, next) => {
        if (!event.hasFlag(bp.IO.WellKnownFlags.SKIP_QNA_PROCESSING)) {
          if (!(await processEvent(event, { bp, storage: this.storage, config }))) {
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
      answer = (await bp.qna.answersOn(event.text)).pop()
      if (!answer) {
        return false
      }
      bp.logger.debug('QnA: matched QnA-maker question', answer.id)
    } else {
      // NB: we rely on NLU being loaded before we receive any event.
      // I'm not sure yet if we can guarantee it
      if (!(event.nlu || {}).intent || !event.nlu.intent.startsWith(NLU_PREFIX)) {
        return false
      }

      bp.logger.debug('QnA: matched NLU intent', event.nlu.intent.name)
      const id = event.nlu.intent.name.substring(NLU_PREFIX.length)
      answer = (await storage.getQuestion(id)).data
    }

    if (!answer.enabled) {
      bp.logger.debug('QnA: question disabled, skipping')
      return false
    }

    if (answer.action.includes('text')) {
      bp.logger.debug('QnA: replying to recognized question with plain text answer', answer.id)
      event.reply(config.textRenderer, { text: answer.answer })
      // return `true` to prevent further middlewares from capturing the message

      if (answer.action === 'text') {
        return true
      }
    }

    if (answer.action.includes('redirect')) {
      bp.logger.debug('QnA: replying to recognized question with redirect', answer.id)
      // TODO: This is used as the `stateId` by the bot template
      // Not sure if it's universal enough for every use-case but
      // I don't see a better alternative as of now
      const stateId = event.sessionId || event.user.id
      bp.logger.debug('QnA: jumping', stateId, answer.redirectFlow, answer.redirectNode)
      await bp.dialogEngine.jumpTo(stateId, answer.redirectFlow, answer.redirectNode)
      // We return false here because the we only jump to the right flow/node and let
      // the bot's natural middleware chain take care of processing the message the normal way
      return false
    }
  }
}

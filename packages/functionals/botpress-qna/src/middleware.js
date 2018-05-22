import { NLU_PREFIX } from './storage'

export const processEvent = async (event, { storage, logger }) => {
  if (!event.nlu.intent || !event.nlu.intent.startsWith(NLU_PREFIX)) {
    return false
  }

  logger.debug('QnA: matched NLU intent', event.nlu.intent.name)
  const id = event.nlu.intent.name.substring(NLU_PREFIX.length)
  const { data } = await storage.getQuestion(id)
  // actually this shouldn't be the case as we delete intents
  // for disabled questions
  if (!data.enabled) {
    logger.debug('QnA: question disabled, skipping')
    return false
  }

  logger.debug('QnA: replying to recognized question', id)
  event.reply('#builtin_text', { text: data.answer })
  // return `true` to prevent further middlewares from capturing the message
  return true
}

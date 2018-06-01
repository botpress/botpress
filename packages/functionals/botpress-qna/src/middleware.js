import { NLU_PREFIX } from './storage'

export const processEvent = async (event, { bp, storage, logger, config }) => {
  // NB: we rely on NLU being loaded before we receive any event.
  // I'm not sure yet if we can guarantee it
  if (!event.nlu || !event.nlu.intent || !event.nlu.intent.startsWith(NLU_PREFIX)) {
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

  if (data.action === 'text') {
    logger.debug('QnA: replying to recognized question with plain text answer', id)
    event.reply(config.textRenderer, { text: data.answer })
    // return `true` to prevent further middlewares from capturing the message
    return true
  } else if (data.action === 'redirect') {
    logger.debug('QnA: replying to recognized question with redirect', id)
    // TODO: This is used as the `stateId` by the bot template
    // Not sure if it's universal enough for every use-case but
    // I don't see a better alternative as of now
    const stateId = event.sessionId || event.user.id
    logger.debug('QnA: jumping', stateId, data.redirectFlow, data.redirectNode)
    await bp.dialogEngine.jumpTo(stateId, data.redirectFlow, data.redirectNode)
    // We return false here because the we only jump to the right flow/node and let
    // the bot's natural middleware chain take care of processing the message the normal way
    return false
  }
}

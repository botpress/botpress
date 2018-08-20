import { UnauthorizedAccessError } from '~/errors'

export default () => {
  function assertBotAuth(req) {
    if (req.user && req.user.iss === 'bot_token' && req.user.id) {
      return
    }

    throw new UnauthorizedAccessError('Bot is not authorized')
  }

  function assertBotId(req, desiredBotId) {
    if (req.user.id !== desiredBotId) {
      throw new UnauthorizedAccessError('Bot does not have permission to perform this operation')
    }
  }

  return { assertBotAuth, assertBotId }
}

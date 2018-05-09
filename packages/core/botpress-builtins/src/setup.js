import { USER_TAG_CONVO_COUNT, USER_TAG_CONVO_LAST } from './common'

/**
 * This method should be called on bot boot in order
 * for the different actions and renderers to work properly.
 *
 * This method will setup and inject different middleware.
 *
 * @param  {Botpress} bp The global Botpress instance
 */
export default function(bp) {
  // Tracks new user conversations
  // Used by the following actions:
  // - Get total number of conversations
  bp.dialogEngine.onBeforeCreated(async (ctx, next) => {
    const { stateId } = ctx

    if (!stateId.includes(':')) {
      // Unknown platform / can't extract userId
      return next()
    }

    const convoCount = await bp.users.getTag(stateId, USER_TAG_CONVO_COUNT)
    await bp.users.tag(stateId, USER_TAG_CONVO_COUNT, parseInt(convoCount || 0) + 1)

    next()
  })

  // Tracks conversation endings
  // Used by the following actions:
  // - Get time since last conversation
  bp.dialogEngine.onBeforeEnd(async (ctx, next) => {
    const { stateId } = ctx

    if (!stateId.includes(':')) {
      // Unknown platform / can't extract userId
      return next()
    }

    const position = await bp.dialogEngine.getCurrentPosition(stateId)
    await bp.users.tag(stateId, USER_TAG_CONVO_LAST, position && position.flow)

    next()
  })
}

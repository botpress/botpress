/**
 * Update user language
 * @title Update user language
 * @category Language
 * @author Botpress, Inc.
 * @param {string} lang - The language code, e.g. "en"
 */
const switchLanguage = async language => {
  event.state.user.language = language
  bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(event.target, 'webchat.data', { payload: { language } }))
  await event.setFlag(bp.IO.WellKnownFlags.FORCE_PERSIST_STATE, true)
}

return switchLanguage(args.lang)

/**
 * Update user language
 * @title Update user language
 * @category Language
 * @author Botpress, Inc.
 * @param {string} lang - The language code, e.g. "en"
 */
const myAction = async lang => {
  event.state.user.language = lang
  await event.setFlag(bp.IO.WellKnownFlags.FORCE_PERSIST_STATE, true)
}

return myAction(args.lang)

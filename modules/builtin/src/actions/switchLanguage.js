async function getVisitorId(userId) {
  const rows = await bp.database('web_user_map').where({ userId })
  if (rows && rows.length) {
    return rows[0] && rows[0].visitorId
  }
}

/**
 * Update user language
 * @title Update user language
 * @category Language
 * @author Botpress, Inc.
 * @param {string} lang - The language code, e.g. "en"
 */
const switchLanguage = async language => {
  event.state.user.language = language
  await event.setFlag(bp.IO.WellKnownFlags.FORCE_PERSIST_STATE, true)

  if (event.channel === 'api') {
    return
  }

  const visitorId = await getVisitorId(event.target)
  bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(visitorId, 'webchat.data', { payload: { language } }))
}

return switchLanguage(args.lang.toLowerCase())

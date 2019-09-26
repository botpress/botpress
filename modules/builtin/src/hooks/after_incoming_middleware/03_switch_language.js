async function hook() {
  console.log('===== SWITCH LANG CALLED')
  const currentLang = event.state.user.language
  console.log('currentLang:', currentLang)
  const lang = event.nlu && event.nlu.language
  console.log('lang:', lang)
  if (!lang || event.nlu.intent.name === 'none' || event.nlu.intent.confidence <= 0.3 || currentLang === lang) {
    console.log('quickly returning')
    return
  }

  const botConfig = await bp.bots.getBotById(event.botId)
  if (botConfig.languages.includes(lang)) {
    event.state.user.language = lang
    await bp.users.updateAttributes(event.channel, event.target, { language: lang })
    await event.setFlag(bp.IO.WellKnownFlags.FORCE_PERSIST_STATE, true)
  }
}

return hook()

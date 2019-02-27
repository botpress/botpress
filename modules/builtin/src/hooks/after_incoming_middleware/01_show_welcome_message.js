const showWelcomeMessage = async () => {
  const botConfig = await bp.config.getBotConfig(event.botId)

  if (event.type !== 'get_started' || !botConfig.showWelcomeMessage) {
    return
  }

  const eventDestination = {
    type: 'text',
    channel: event.channel,
    target: event.target,
    botId: event.botId,
    threadId: event.threadId
  }

  const payloads = await bp.cms.renderElement(
    'builtin_text',
    { text: botConfig.details.welcomeMessage, typing: true },
    eventDestination
  )

  await bp.events.replyToEvent(event, payloads)
}

return showWelcomeMessage()

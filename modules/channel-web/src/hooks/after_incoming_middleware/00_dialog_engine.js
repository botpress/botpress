const messageTypesToDiscard = ['request_start_conversation', 'say_something', 'postback']

if (messageTypesToDiscard.includes(event.type)) {
  event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)

  if (event.type === 'say_something' && event.payload.text) {
    saySomething()
  }

  if (event.type === 'postback') {
    console.log('received postback event: ', event.payload)
  }
}

async function saySomething() {
  const text = event.payload.text

  if (text.startsWith('#!')) {
    /**
     * Sends an existing content element. Event is specified twice, since the first parameters are the
     * element arguments, and the second one is the event destination (required fields: botId, target, threadId, channel)
     */
    const content = await bp.cms.renderElement(text, event, event)
    await bp.events.replyToEvent(event, content)
  } else {
    // Sends a basic text message
    const payloads = await bp.cms.renderElement('builtin_text', { text, typing: true }, event.channel)
    await bp.events.replyToEvent(event, payloads)
  }
}

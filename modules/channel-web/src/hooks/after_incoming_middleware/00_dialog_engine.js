const messageTypesToDiscard = ['request_start_conversation', 'say_something', 'postback']

if (messageTypesToDiscard.includes(event.type)) {
  event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)

  if (event.type === 'postback') {
    bp.logger.warn(`Just received a postback event: ${event.payload}. 
    To handle these kind of events. you need to create a hook that will process them.
    Please refer to the documentation here: https://botpress.io/docs/build/code/#hooks`)
  }
}

const saySomethingHook = async () => {
  const text = event.payload.text

  if (event.type === 'say_something' && text && text.length) {
    if (text.startsWith('#!')) {
      /**
       * Sends an existing content element. Event is specified twice, since the first parameters are the
       * element arguments, and the second one is the event destination (required fields: botId, target, threadId, channel)
       */
      const content = await bp.cms.renderElement(text, event, event)
      await bp.events.replyToEvent(event, content)
    } else {
      // Sends a basic text message
      const payloads = await bp.cms.renderElement('builtin_text', { text, typing: true }, event)
      await bp.events.replyToEvent(event, payloads)
    }
  }
}

return saySomethingHook()

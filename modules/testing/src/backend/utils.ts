export const convertLastMessages = (lastMessages, eventId) => {
  if (!lastMessages) {
    return
  }
  const lastConvo = eventId ? lastMessages.filter(x => x.eventId === eventId) : lastMessages

  if (!lastConvo.length) {
    return
  }

  return {
    userMessage: lastConvo[0].incomingPreview,
    botReplies: lastConvo.map(x => {
      return {
        // tslint:disable-next-line:no-null-keyword
        botResponse: x.replyPreview === undefined ? null : x.replyPreview,
        replySource: x.replySource
      }
    })
  }
}

import crypto from 'crypto'

const appendIncomingMsg = async () => {
  if (event.preview && event.type !== 'visit') {
    await bp.database('msg_history').insert({
      created_on: bp.database.date.format(event.createdOn),
      conversation_hash: crypto
        .createHash('md5')
        .update(`${event.threadId}-${event.target}-${event.channel}`)
        .digest('hex'),
      thread_id: event.threadId,
      bot_id: event.botId,
      target: event.target,
      channel: event.channel,
      msg_content: bp.database.json.set(event)
    })
  }
}

return appendIncomingMsg()

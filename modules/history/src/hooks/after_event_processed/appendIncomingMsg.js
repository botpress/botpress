const appendIncomingMsg = async () => {
  if (event.preview && event.type !== 'visit') {
    await bp.database('msg_history').insert({
      created_on: bp.database.date.format(event.createdOn),
      thread_id: event.threadId,
      bot_id: event.botId,
      msg_content: bp.database.json.set(event)
    })
  }
}

return appendIncomingMsg()

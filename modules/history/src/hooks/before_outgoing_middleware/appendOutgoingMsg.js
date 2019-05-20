const appendOutgoingMsg = async () => {
  if (event.type == 'file') {
    event.preview = 'file'
  }

  if (event.preview) {
    await bp.database('msg_history').insert({
      created_on: bp.database.date.format(event.createdOn),
      thread_id: event.threadId,
      bot_id: event.botId,
      msg_content: JSON.stringify(event)
    })
  }
}

return appendOutgoingMsg()

const appendIngoingMsg = async () => {
  if (event.preview && event.type != 'visit') {
    await bp.database('msg_history').insert({
      created_on: event.createdOn,
      thread_id: event.threadId,
      bot_id: event.botId,
      msg_content: JSON.stringify(event)
    })
  }
}

return appendIngoingMsg()

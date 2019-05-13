const appendIngoingMsg = async () => {
  if (event.type === 'text' || event.type === 'quick_reply') {
    await bp.database('msg_history').insert({ msg_content: JSON.stringify(event) })
  }
}

return appendIngoingMsg()

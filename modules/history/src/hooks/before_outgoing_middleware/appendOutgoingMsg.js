const appendOutgoingMsg = async () => {
  if (event.type === 'text') {
    await bp.database('msg_history').insert({ msg_content: JSON.stringify(event) })
  }
}

return appendOutgoingMsg()

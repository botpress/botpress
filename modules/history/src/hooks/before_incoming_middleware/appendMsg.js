const appendMsg = async () => {
  if (!event.state.session['previous-msg']) {
    event.state.session['previous-msg'] = []
  }
  if (event.payload.type === 'text') {
    event.state.session['previous-msg'].push(event.payload.text)
    await bp.database('msg_history').insert({ msg: event.payload.text })
  }
}

return appendMsg()

const messageTypesToDiscard = ['session_reset', 'typing', 'visit']
if (messageTypesToDiscard.includes(event.type)) {
  event.setFlag('skipDialogEngine', true)
}

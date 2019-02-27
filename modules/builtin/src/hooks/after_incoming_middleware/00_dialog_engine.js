const messageTypesToDiscard = ['session_reset', 'typing', 'visit', 'get_started']

if (messageTypesToDiscard.includes(event.type)) {
  event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)
}

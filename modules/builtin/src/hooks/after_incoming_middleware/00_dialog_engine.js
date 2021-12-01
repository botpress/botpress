const messageTypesToDiscard = ['session_reset', 'typing', 'visit', 'session_reference', 'proactive-trigger']

if (messageTypesToDiscard.includes(event.type)) {
  event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)
}

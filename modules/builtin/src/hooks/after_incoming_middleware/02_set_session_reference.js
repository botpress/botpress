async function hook() {
  if (event.type === 'session_reference' && event.signature && event.text) {
    const verifySignature = await bp.security.getMessageSignature(event.text)
    if (event.signature === verifySignature) {
      Object.assign(event.state.session, {
        reference: event.text
      })
      event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)
      event.setFlag(bp.IO.WellKnownFlags.FORCE_PERSIST_STATE, true)
    }
  }
}

return hook()

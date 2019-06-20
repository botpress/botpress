if (event.type === 'contact-form') {
  event.state.session.contactForm = event.payload.payload.payload // issh
  event.setFlag(bp.IO.WellKnownFlags.FORCE_PERSIST_STATE, true)
}

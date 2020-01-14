if (event.type === 'feedback') {
  console.log('Feedback received')
  const text = event.payload.text
  console.log(text)
  bp.events.findEvents(
  // 1. If goal sucessful, send outgoing event asking for feedback
  // 2. When receiving incoming event, get previous event of the same thread
  // 3. If feedback is +1 = helpful otherwise -1 = improve
}

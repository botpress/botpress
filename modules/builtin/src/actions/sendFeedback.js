/**
 * Sends feedback (1 for positive or -1 for negative) at the end of a goal
 *
 * @title Send Feedback
 * @category NDU
 * @author Botpress, Inc.
 * @param {number} [value] - The feedback value. Use 1 for positive feedback, -1 for negative feedback
 */

const sendFeedback = async value => {
  const feedback = parseInt(value.trim())
  if (feedback !== 1 && feedback !== -1) {
    throw `Unexpected value: ${value}`
  }
  const previousGoal = event.state.session.lastGoals[0]
  if (!previousGoal) {
    return
  }
  const goalId = previousGoal.eventId
  const targetEvent = (await bp.events.findEvents({ incomingEventId: goalId, goalId }, { count: 1 }))[0]
  await bp.events.updateEvent(targetEvent.id, { feedback })
}

return sendFeedback(args.value)

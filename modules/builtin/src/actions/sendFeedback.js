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

  await bp.events.saveUserFeedback(temp.eventId, event.target, feedback, 'workflow')
}

return sendFeedback(args.value)

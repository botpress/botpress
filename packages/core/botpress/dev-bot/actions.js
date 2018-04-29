/**
 * Color mixer.
 * @module actions
 */

module.exports = {
  /**
   * Sets user Tag.
   * @param {Object} state - The current state of the conversation.
   * @param {Object} event - The original (latest) event received from the user in the conversation.
   * @param {Object} args - The arguments that was passed to this action from the Visual Flow Builder.
   * @param {string} args.name - Name of the tag.
   * @param {string} args.value - Value of the tag.
   */
  setUserTag: async (state, event, { name, value }) => {
    // await event.bp.users.tag(event.user.id, name, value)
    return { ...state }
  }
}

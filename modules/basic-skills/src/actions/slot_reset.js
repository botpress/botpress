/**
 * Resets the slot from the user's session, allowing a new answer to be stored.
 * @title Reset Slot
 * @category Slot
 * @author Botpress, Inc.
 * @param slotName The name of the slot
 */
const resetSlot = async slotName => {
  event.state.session.slots[slotName] = undefined
}

return resetSlot(args.slotName)

/**
 * Reset the slot
 * @title Reset Slot
 * @category Slot
 * @author Botpress, Inc.
 * @param slotName The name of the slot
 */
const resetSlot = async slotName => {
  event.state.session.extractedSlots[slotName] = undefined
}

return resetSlot(args.slotName)

/**
 * Bypass areadyExtracted flag when the slot has been extracted recently.
 * This is to allow the slot filling to continue instead of being blocked by alreadyExtracted.
 * @hidden true
 * @param slotName The name of the slot to extract. (e.g. destination_from)
 */
const validateExtract = slotName => {
  const last = session.extractedSlots[slotName].timestamp
  const now = new Date()
  const diffInSeconds = Math.floor((now - last) / 1000)

  if (diffInSeconds > 60) {
    temp.alreadyExtracted = true
  } else {
    temp.extracted = true
  }
}

return validateExtract(args.slotName)

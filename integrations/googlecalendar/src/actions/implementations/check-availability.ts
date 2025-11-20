import { wrapAction } from '../action-wrapper'

type TimeSlot = {
  start: Date
  end: Date
}

function _addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000)
}

function _doTimeRangesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  return start1 < end2 && end1 > start2
}

function _formatTime(date: Date, timezone: string): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  })
}

function generateTimeSlots(startTime: Date, endTime: Date, slotDurationMinutes: number): TimeSlot[] {
  const slots: TimeSlot[] = []
  let currentSlotStart = new Date(startTime)

  while (currentSlotStart < endTime) {
    const currentSlotEnd = _addMinutes(currentSlotStart, slotDurationMinutes)

    if (currentSlotEnd > endTime) {
      break
    }

    slots.push({
      start: new Date(currentSlotStart),
      end: currentSlotEnd,
    })

    currentSlotStart = _addMinutes(currentSlotStart, slotDurationMinutes)
  }

  return slots
}

function filterAvailableSlots(allSlots: TimeSlot[], busyTimes: TimeSlot[]): TimeSlot[] {
  return allSlots.filter((slot) => {
    const hasConflict = busyTimes.some((busySlot) =>
      _doTimeRangesOverlap(slot.start, slot.end, busySlot.start, busySlot.end)
    )
    return !hasConflict
  })
}

export const checkAvailability = wrapAction(
  { actionName: 'checkAvailability', errorMessageWhenFailed: 'Failed to check calendar availability' },
  async ({ googleClient }, input) => {
    const { busySlots } = await googleClient.getBusySlots({
      timeMin: input.timeMin,
      timeMax: input.timeMax,
    })

    const searchStartTime = new Date(input.timeMin)
    const searchEndTime = new Date(input.timeMax)

    const busyTimeSlots: TimeSlot[] = busySlots.map((slot) => ({
      start: new Date(slot.start),
      end: new Date(slot.end),
    }))

    const allPossibleSlots = generateTimeSlots(searchStartTime, searchEndTime, input.slotDurationMinutes || 45)
    const availableSlots = filterAvailableSlots(allPossibleSlots, busyTimeSlots)
    const freeSlotsISO = availableSlots.map((slot) => ({
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
    }))

    const freeSlotsHumanReadable = availableSlots.map(
      (slot) =>
        `${_formatTime(slot.start, input.timezone || 'America/Toronto')} – ${_formatTime(slot.end, input.timezone || 'America/Toronto')}`
    )

    return {
      freeSlots: freeSlotsISO,
      formattedFreeSlots: freeSlotsHumanReadable,
      busySlots,
    }
  }
)

import { wrapAction } from '../action-wrapper'

interface CheckAvailabilityInput {
  timeMin: string
  timeMax: string
  slotDurationMinutes: number
  timezone: string
}

interface BusySlot {
  start: string
  end: string
}

interface CheckAvailabilityOutput {
  freeSlots: Array<{ start: string; end: string }>
  formattedFreeSlots: string[]
  busySlots: BusySlot[]
}

export const checkAvailability = wrapAction(
  { actionName: 'checkAvailability', errorMessageWhenFailed: 'Failed to check calendar availability' },
  async ({ googleClient }, input: CheckAvailabilityInput): Promise<CheckAvailabilityOutput> => {
    // Fetch busy times from Google Calendar
    const { busySlots } = await googleClient.checkFreeBusy({
      timeMin: input.timeMin,
      timeMax: input.timeMax,
    })

    // Helper functions
    const toDate = (s: string) => new Date(s)
    const addMin = (d: Date, m: number) => new Date(d.getTime() + m * 60000)
    const overlaps = (s1: Date, e1: Date, s2: Date, e2: Date) => s1 < e2 && e1 > s2
    const fmt = (d: Date) =>
      d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: input.timezone,
      })

    const searchStart = toDate(input.timeMin)
    const searchEnd = toDate(input.timeMax)

    // Convert busy slots to Date objects
    const busyTimes = busySlots.map((slot) => ({
      start: toDate(slot.start),
      end: toDate(slot.end),
    }))

    // Generate all possible time slots
    const allSlots: Array<{ start: Date; end: Date }> = []
    for (let slotStart = new Date(searchStart); slotStart < searchEnd; slotStart = addMin(slotStart, input.slotDurationMinutes)) {
      const slotEnd = addMin(slotStart, input.slotDurationMinutes)
      if (slotEnd > searchEnd) break
      allSlots.push({ start: new Date(slotStart), end: slotEnd })
    }

    // Filter out slots that overlap with busy times
    const freeSlots = allSlots.filter(
      (slot) => !busyTimes.some((busy) => overlaps(slot.start, slot.end, busy.start, busy.end))
    )

    // Format output
    const freeSlotsFormatted = freeSlots.map((slot) => ({
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
    }))

    const formattedFreeSlots = freeSlots.map((slot) => `${fmt(slot.start)} – ${fmt(slot.end)}`)

    return {
      freeSlots: freeSlotsFormatted,
      formattedFreeSlots,
      busySlots,
    }
  }
)

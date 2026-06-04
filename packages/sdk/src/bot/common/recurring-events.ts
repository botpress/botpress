import { BotDefinitionProps, EventDefinition, RecurringEventDefinition } from '../definition'

export function deriveRecurringEventsFromEventDefs(
  events: Record<string, Pick<EventDefinition, 'recurring'>> | undefined
): NonNullable<BotDefinitionProps['recurringEvents']> {
  return Object.fromEntries(
    Object.entries(events ?? {})
      .map(([eventName, event]): [string, RecurringEventDefinition] | null =>
        event.recurring
          ? [eventName, { type: eventName, payload: event.recurring.payload, schedule: event.recurring.schedule }]
          : null
      )
      .filter((x) => x !== null)
  )
}

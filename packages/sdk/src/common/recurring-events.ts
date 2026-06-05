import { BotDefinitionProps, EventDefinition, RecurringEventDefinition } from '../bot/definition'

export function resolveRecurrence(
  events: Record<string, EventDefinition<any>> | undefined,
  explicitRecurringEvents: BotDefinitionProps['recurringEvents']
): {
  events: Record<string, EventDefinition<any>> | undefined
  recurringEvents: BotDefinitionProps['recurringEvents']
} {
  const strippedEntries: [string, Omit<EventDefinition<any>, 'recurrence'>][] = []
  const derivedEntries: [string, RecurringEventDefinition][] = []

  for (const [key, { recurrence, ...rest }] of Object.entries(events ?? {})) {
    strippedEntries.push([key, rest])
    if (recurrence) {
      derivedEntries.push([key, { type: key, payload: recurrence.payload, schedule: { cron: recurrence.cron } }])
    }
  }

  const merged = { ...Object.fromEntries(derivedEntries), ...explicitRecurringEvents }
  return {
    events: events !== undefined ? Object.fromEntries(strippedEntries) : undefined,
    recurringEvents: Object.keys(merged).length ? merged : undefined,
  }
}

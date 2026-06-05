import { BotDefinitionProps, EventDefinition, RecurringEventDefinition } from '../bot/definition'

export function stripRecurringFromEvents(
  events: Record<string, EventDefinition> | undefined
): Record<string, EventDefinition> | undefined {
  if (!events) return undefined
  return Object.fromEntries(Object.entries(events).map(([key, { recurring: _, ...rest }]) => [key, rest]))
}

export function resolveRecurringEvents(
  events: Record<string, EventDefinition> | undefined,
  explicitRecurringEvents: BotDefinitionProps['recurringEvents']
): BotDefinitionProps['recurringEvents'] {
  const derived: NonNullable<BotDefinitionProps['recurringEvents']> = Object.fromEntries(
    Object.entries(events ?? {})
      .map(([eventName, event]): [string, RecurringEventDefinition] | null =>
        event.recurring
          ? [eventName, { type: eventName, payload: event.recurring.payload, schedule: event.recurring.schedule }]
          : null
      )
      .filter((x) => x !== null)
  )
  const merged = { ...derived, ...explicitRecurringEvents }
  return Object.keys(merged).length ? merged : undefined
}

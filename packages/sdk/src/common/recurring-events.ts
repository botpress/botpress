import { BotDefinitionProps, EventDefinition, RecurringEventDefinition } from '../bot/definition'
import { SafeOmit } from '../utils/type-utils'

type StrippedEvents<TEvents extends Record<string, EventDefinition>> = {
  [K in keyof TEvents]: SafeOmit<TEvents[K], 'recurrence'>
}

export function stripRecurringFromEvents<TEvents extends Record<string, EventDefinition>>(
  events: TEvents
): StrippedEvents<TEvents>
export function stripRecurringFromEvents<TEvents extends Record<string, EventDefinition>>(
  events: TEvents | undefined
): StrippedEvents<TEvents> | undefined
export function stripRecurringFromEvents<TEvents extends Record<string, EventDefinition>>(
  events: TEvents | undefined
): StrippedEvents<TEvents> | undefined {
  if (!events) return undefined
  return Object.fromEntries(
    Object.entries(events).map(([key, { recurrence: _, ...rest }]) => [key, rest])
  ) as StrippedEvents<TEvents>
}

export function resolveRecurringEvents(
  events: Record<string, EventDefinition> | undefined,
  explicitRecurringEvents: BotDefinitionProps['recurringEvents']
): BotDefinitionProps['recurringEvents'] {
  const derived: NonNullable<BotDefinitionProps['recurringEvents']> = Object.fromEntries(
    Object.entries(events ?? {})
      .map(([eventName, event]): [string, RecurringEventDefinition] | null =>
        event.recurrence
          ? [
              eventName,
              { type: eventName, payload: event.recurrence.payload, schedule: { cron: event.recurrence.cron } },
            ]
          : null
      )
      .filter((x) => x !== null)
  )
  const merged = { ...derived, ...explicitRecurringEvents }
  return Object.keys(merged).length ? merged : undefined
}

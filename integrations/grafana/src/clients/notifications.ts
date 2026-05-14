import { z } from '@botpress/sdk'
import { matcherSchema, notificationPolicySchema } from '../../definitions/notification-schemas'
import {
  routeGetPolicyTree,
  routePutPolicyTree,
} from '../grafana-legacy-client'
import type { Route } from '../grafana-legacy-client'
import { type GrafanaConfig, legacyClient } from './config'

type PolicyMatcher = z.infer<typeof matcherSchema>

type NotificationPolicyInput = z.infer<typeof notificationPolicySchema>

function errorMessage(error: unknown): string {
  return typeof error === 'object' ? JSON.stringify(error) : String(error)
}

function toObjectMatchers(matchers: PolicyMatcher[]): [string, string, string][] {
  return matchers.map((m) => [m.name, m.operator, m.value])
}

export async function createNotificationPolicy(
  config: GrafanaConfig,
  input: NotificationPolicyInput
): Promise<{ success: boolean; error?: string }> {
  const { data: tree, error: getError } = await routeGetPolicyTree({ client: legacyClient(config) })
  if (getError || !tree) return { success: false, error: errorMessage(getError) }

  const { error } = await routePutPolicyTree({
    client: legacyClient(config),
    body: {
      ...tree,
      routes: [
        ...(tree.routes ?? []),
        {
          receiver: input.receiver,
          continue: input.continue,
          group_by: input.group_by,
          group_wait: input.group_wait,
          group_interval: input.group_interval,
          repeat_interval: input.repeat_interval,
          mute_time_intervals: input.mute_time_intervals,
          active_time_intervals: input.active_time_intervals,
          object_matchers: input.matchers ? toObjectMatchers(input.matchers) : undefined,
        },
      ],
    },
  })
  return error ? { success: false, error: errorMessage(error) } : { success: true }
}

export async function listNotificationPolicies(
  config: GrafanaConfig
): Promise<{ success: boolean; data?: { receiver?: string; matchers?: unknown; object_matchers?: unknown; group_by?: string[]; continue?: boolean }[]; error?: string }> {
  const { data: tree, error } = await routeGetPolicyTree({ client: legacyClient(config) })
  if (error || !tree) return { success: false, error: errorMessage(error) }
  const routes = (tree.routes ?? []).map((r) => ({
    receiver: r.receiver,
    matchers: r.matchers,
    object_matchers: r.object_matchers,
    group_by: r.group_by,
    continue: r.continue,
  }))
  return { success: true, data: routes }
}

export async function editNotificationPolicy(
  config: GrafanaConfig,
  input: {
    receiver: string
    matchers: PolicyMatcher[]
    updates: Partial<NotificationPolicyInput>
  }
): Promise<{ success: boolean; error?: string }> {
  const { data: tree, error: getError } = await routeGetPolicyTree({ client: legacyClient(config) })
  if (getError || !tree) return { success: false, error: errorMessage(getError) }

  const inputTuples = JSON.stringify(toObjectMatchers(input.matchers))
  const isMatch = (r: Route) =>
    r.receiver === input.receiver &&
    JSON.stringify(r.object_matchers) === inputTuples

  const { error } = await routePutPolicyTree({
    client: legacyClient(config),
    body: {
      ...tree,
      routes: (tree.routes ?? []).map((r) =>
        isMatch(r)
          ? {
              ...r,
              receiver: input.updates.receiver ?? r.receiver,
              object_matchers: input.updates.matchers
                ? toObjectMatchers(input.updates.matchers)
                : r.object_matchers,
              continue: input.updates.continue ?? r.continue,
              group_by: input.updates.group_by ?? r.group_by,
              group_wait: input.updates.group_wait ?? r.group_wait,
              group_interval: input.updates.group_interval ?? r.group_interval,
              repeat_interval: input.updates.repeat_interval ?? r.repeat_interval,
              mute_time_intervals: input.updates.mute_time_intervals ?? r.mute_time_intervals,
              active_time_intervals: input.updates.active_time_intervals ?? r.active_time_intervals,
            }
          : r
      ),
    },
  })
  return error ? { success: false, error: errorMessage(error) } : { success: true }
}

export async function editDefaultNotificationPolicy(
  config: GrafanaConfig,
  input: Partial<Omit<NotificationPolicyInput, 'matchers'>>
): Promise<{ success: boolean; error?: string }> {
  const { data: tree, error: getError } = await routeGetPolicyTree({ client: legacyClient(config) })
  if (getError || !tree) return { success: false, error: errorMessage(getError) }

  const { error } = await routePutPolicyTree({
    client: legacyClient(config),
    body: {
      ...tree,
      ...(input.receiver !== undefined && { receiver: input.receiver }),
      ...(input.group_by !== undefined && { group_by: input.group_by }),
      ...(input.group_wait !== undefined && { group_wait: input.group_wait }),
      ...(input.group_interval !== undefined && { group_interval: input.group_interval }),
      ...(input.repeat_interval !== undefined && { repeat_interval: input.repeat_interval }),
      ...(input.mute_time_intervals !== undefined && { mute_time_intervals: input.mute_time_intervals }),
      ...(input.active_time_intervals !== undefined && { active_time_intervals: input.active_time_intervals }),
    },
  })
  return error ? { success: false, error: errorMessage(error) } : { success: true }
}

export async function deleteNotificationPolicy(
  config: GrafanaConfig,
  input: { receiver: string; matchers: PolicyMatcher[] }
): Promise<{ success: boolean; error?: string }> {
  const { data: tree, error: getError } = await routeGetPolicyTree({ client: legacyClient(config) })
  if (getError || !tree) return { success: false, error: errorMessage(getError) }

  const inputTuples = JSON.stringify(toObjectMatchers(input.matchers))
  const isMatch = (r: Route) =>
    r.receiver === input.receiver &&
    JSON.stringify(r.object_matchers) === inputTuples

  const { error } = await routePutPolicyTree({
    client: legacyClient(config),
    body: {
      ...tree,
      routes: (tree.routes ?? []).filter((r) => !isMatch(r)),
    },
  })
  return error ? { success: false, error: errorMessage(error) } : { success: true }
}

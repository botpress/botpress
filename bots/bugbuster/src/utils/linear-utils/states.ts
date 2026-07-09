import * as types from '../../types'

/**
 * Maps a Linear workflow-state `type` to our internal `CommonState`(s).
 *
 * Some common states share the same Linear `type`: e.g. STAGING, BLOCKED and
 * IN_PROGRESS are all `started`, while STALE and CANCELED are both `canceled`.
 * Those groups are the entries below with a `byName` map — the shared type is
 * made structurally obvious rather than hidden in a flat list.
 *
 * Resolution is keyed by `type` first and then by an exact (lower-cased) `name`,
 * falling back to `default`. Because there is no linear scan over guards, no
 * entry can accidentally shadow another: order within this record is irrelevant.
 */
type StateResolver = {
  byName?: Record<string, types.CommonStateName>
  default: types.CommonStateName
}

const COMMON_STATE_BY_TYPE: Record<types.LinearStateType, StateResolver> = {
  triage: { default: 'TRIAGE' },
  backlog: { default: 'BACKLOG' },
  unstarted: { default: 'TODO' },
  started: {
    byName: { staging: 'STAGING', blocked: 'BLOCKED' },
    default: 'IN_PROGRESS',
  },
  completed: { default: 'DONE' },
  canceled: {
    byName: { stale: 'STALE' },
    default: 'CANCELED',
  },
  duplicate: {
    default: 'DUPLICATE',
  },
}

export const findCommonState = (state: types.LinearState): types.CommonStateName | undefined => {
  const resolver = COMMON_STATE_BY_TYPE[state.type]
  if (!resolver) {
    return
  }
  const name = state.name.toLowerCase()
  return resolver.byName?.[name] ?? resolver.default
}

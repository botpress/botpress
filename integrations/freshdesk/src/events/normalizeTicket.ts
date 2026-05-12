const NUM_FIELDS = ['id', 'status', 'priority', 'requester_id', 'responder_id', 'group_id'] as const

export function normalizeTicket(raw: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...raw }
  for (const field of NUM_FIELDS) {
    const val = result[field]
    if (val != null && val !== '') {
      result[field] = Number(val)
    } else {
      result[field] = null
    }
  }
  return result
}

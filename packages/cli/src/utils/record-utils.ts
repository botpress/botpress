export const setNullOnMissingValues = <A, B>(
  record: Record<string, A> = {},
  oldRecord: Record<string, B> = {}
): Record<string, A | null> => {
  const newRecord: Record<string, A | null> = {}

  for (const [key, value] of Object.entries(record)) {
    newRecord[key] = value
  }

  for (const value of Object.keys(oldRecord)) {
    if (!record[value]) {
      newRecord[value] = null
    }
  }

  return newRecord
}

export const zipObjects = <A, B>(
  recordA: Record<string, A>,
  recordB: Record<string, B>
): Record<string, [A | null, B | null]> => {
  const allKeys = new Set([...Object.keys(recordA), ...Object.keys(recordB)])
  const newRecord: Record<string, [A | null, B | null]> = {}

  for (const key of allKeys) {
    newRecord[key] = [recordA[key] ?? null, recordB[key] ?? null]
  }

  return newRecord
}

export const mapValues = <A, B>(record: Record<string, A>, fn: (value: A) => B): Record<string, B> => {
  const newRecord: Record<string, B> = {}

  for (const [key, value] of Object.entries(record)) {
    newRecord[key] = fn(value)
  }

  return newRecord
}

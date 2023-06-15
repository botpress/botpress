export const setOnNullMissingValues = <A, B>(
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

import _ from 'lodash'

const TABLE_RESERVED_KEYWORDS = ['id', 'createdAt', 'updatedAt']

export const PRIMARY_KEY = '_id'

export const escapeObject = (obj: object): object => {
  return _(obj)
    .toPairs()
    .map(([key, value]) => [escapeKey(key), value])
    .fromPairs()
    .value()
}

export const unescapeObject = (obj: object): object => {
  return _(obj)
    .toPairs()
    .map(([key, value]) => [unescapeKey(key), value])
    .fromPairs()
    .value()
}

export const escapeKey = (key: string): string => (TABLE_RESERVED_KEYWORDS.includes(key) ? `_${key}` : key)

export const unescapeKey = (key: string): string => {
  const escapedColumns = TABLE_RESERVED_KEYWORDS.map(escapeKey)
  return escapedColumns.includes(key) ? key.slice(1) : key
}

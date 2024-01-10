import { prefixToObjectMap } from '@bpinternal/const'
import * as uuid from 'uuid'

const ULID_LENGTH = 26 // Reference: https://github.com/ulid/spec#canonical-string-representation

export function isValidID(id: string) {
  // Note: UUIDs were used first and then prefixed ULIDs were introduced.
  return isPrefixedULID(id) || uuid.validate(id)
}

export function isPrefixedULID(id: string) {
  const [prefix, identifier] = id.split('_')

  if (!(prefix && identifier)) {
    return false
  }

  if (!Object.keys(prefixToObjectMap).includes(prefix)) {
    return false
  }

  if (identifier.length < ULID_LENGTH) {
    return false
  }

  return true
}

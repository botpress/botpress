import { PLUGIN_PREFIX_SEPARATOR } from '../consts'

export const unprefixTagsOwnedByPlugin = <T extends {} | { tags?: Record<string, string> }>(
  obj: T,
  { alias }: { alias?: string }
): T => {
  if (!('tags' in obj) || !alias) {
    return obj
  }

  const prefix = `${alias}${PLUGIN_PREFIX_SEPARATOR}` as const

  const unprefixedTags = Object.fromEntries(
    Object.entries(obj.tags ?? {}).flatMap(([key, value]) =>
      key.startsWith(prefix) ? [[key.slice(prefix.length), value]] : []
    )
  )

  return {
    ...obj,
    tags: unprefixedTags,
  }
}

export const prefixTagsIfNeeded = <T extends {} | { tags?: Record<string, string> }>(
  obj: T,
  { alias }: { alias?: string }
): T => {
  if (!('tags' in obj) || !alias) {
    return obj
  }

  const prefix = `${alias}${PLUGIN_PREFIX_SEPARATOR}` as const

  const prefixedTags = Object.fromEntries(
    Object.entries(obj.tags ?? {}).map(([key, value]) => [key.startsWith(prefix) ? key : `${prefix}${key}`, value])
  )

  return {
    ...obj,
    tags: prefixedTags,
  }
}

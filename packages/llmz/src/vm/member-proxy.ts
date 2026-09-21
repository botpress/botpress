/** Host-only metadata lets QuickJS install the same missing-member behavior in its own realm. */
export const MISSING_MEMBER = Symbol('llmz.missingMember')

/** Only registered own members are callable; inherited Object methods are not API members. */
export function withMissingMember<T extends object>(target: T, missing: (name: string) => never): T {
  Object.defineProperty(target, MISSING_MEMBER, { value: missing })
  Object.freeze(target)
  return new Proxy(target, {
    get(object, key, receiver) {
      if (typeof key === 'string' && !Object.hasOwn(object, key)) {
        return missing(key)
      }

      return Reflect.get(object, key, receiver)
    },
  })
}

export type ValueOrGetter<T, I> = T | ((ctx: I) => T) | ((ctx: I) => Promise<T>)

export const getValue = async <T, I>(valueOrGetter: ValueOrGetter<T, I>, ctx?: I): Promise<T> => {
  if (typeof valueOrGetter === 'function') {
    try {
      return await (valueOrGetter as Function)(ctx)
    } catch (e) {
      throw new Error(`Error while getting value for ${valueOrGetter}: ${e}`)
    }
  } else {
    return valueOrGetter
  }
}

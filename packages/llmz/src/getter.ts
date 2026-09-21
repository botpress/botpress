import { InvalidConfigurationError } from './errors.js'
export type ValueOrGetter<T, I> = T | ((ctx: I) => T) | ((ctx: I) => Promise<T>)

export const getValue = async <T, I>(valueOrGetter: ValueOrGetter<T, I>, ctx?: I): Promise<T> => {
  if (typeof valueOrGetter === 'function') {
    try {
      return await (valueOrGetter as Function)(ctx)
    } catch (e) {
      throw new InvalidConfigurationError(`Error while getting value for ${valueOrGetter}: ${e}`, { cause: e })
    }
  } else {
    return valueOrGetter
  }
}

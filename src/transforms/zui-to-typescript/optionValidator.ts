import { type Options } from '.'

export function validateOptions({ maxItems }: Partial<Options>): void {
  if (maxItems !== undefined && maxItems < -1) {
    throw RangeError(`Expected options.maxItems to be >= -1, but was given ${maxItems}.`)
  }
}

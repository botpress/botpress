export function joinValues<T extends any[]>(array: T, separator = ' | '): string {
  return array.map((val) => (typeof val === 'string' ? `'${val}'` : val)).join(separator)
}

export const jsonStringifyReplacer = (_: string, value: any): any => {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  return value
}

export const compareFunctions = (a: Function, b: Function) => {
  /**
   * The only proper way to deeply compare functions would be to ensure they return the same value for the same input.
   * This is impossible to do unless the domain of the function is known and the function is pure.
   *
   * Comparing source code is not ideal since 2 function could be equivalent but have different source code,
   * but that's our best option.
   */
  return a.toString() === b.toString()
}

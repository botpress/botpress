export const omit = <O extends object, K extends keyof O>(obj: O, property: K): Omit<O, K> => {
  const { [property]: _, ...rest } = obj
  return rest
}

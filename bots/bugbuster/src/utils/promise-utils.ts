export const some = async <T>(xs: T[], fn: (x: T) => Promise<boolean>): Promise<boolean> => {
  for (const x of xs) {
    if (await fn(x)) {
      return true
    }
  }
  return false
}

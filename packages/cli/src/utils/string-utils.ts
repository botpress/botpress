export const splitOnce = (text: string, separator: string): [string, string | undefined] => {
  const index = text.indexOf(separator)
  if (index === -1) {
    return [text, undefined]
  }
  return [text.slice(0, index), text.slice(index + 1)]
}

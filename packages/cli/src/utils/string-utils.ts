export const splitOnce = (text: string, separator: string): [string, string | undefined] => {
  const index = text.indexOf(separator)
  if (index === -1) {
    return [text, undefined]
  }
  return [text.slice(0, index), text.slice(index + 1)]
}

export function* chunkString(input: string, chunkSize: number): Generator<string, void, void> {
  for (let i = 0; i < input.length; i += chunkSize) {
    yield input.slice(i, i + chunkSize)
  }
}

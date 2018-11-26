const ENTITIES_REGEX = /\[(.+?)\]\(([\w_-]+)\)/gi

export type Token = { type: string; value: string }

export const tokenize = (phrase: string, lowercase: boolean = true): Token[] => {
  let m: RegExpExecArray | null
  let start = 0
  const tokens: Token[] = []

  do {
    m = ENTITIES_REGEX.exec(phrase)
    if (m) {
      const sub = phrase.substr(start, m.index - start - 1)
      sub
        .split(' ')
        .filter(x => x.length)
        .forEach(t => {
          tokens.push({ type: 'o', value: t.toLowerCase() })
        })

      m[1]
        .split(' ')
        .filter(x => x.length)
        .forEach((t, i) => {
          tokens.push({ type: (i === 0 ? 'B-' : 'I-') + m![2]!, value: t })
        })

      start = m.index + m[0].length
    }
  } while (m)

  if (start !== phrase.length) {
    phrase
      .substr(start, phrase.length - start)
      .split(' ')
      .filter(x => x.length)
      .forEach(t => {
        tokens.push({ type: 'o', value: lowercase ? t.toLowerCase() : t })
      })
  }

  return tokens
}

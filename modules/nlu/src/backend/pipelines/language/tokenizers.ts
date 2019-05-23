const path = require('path')
const kuro = require('kuromoji')

const WhiteSpaceTokenizer = txt => txt.split(' ').filter(x => x.trim().length)

const tok = (() => {
  const kuromojiDir = path.dirname(require.resolve('kuromoji'))
  const dicPath = path.join(kuromojiDir, '..', 'dict')
  let tokenizer = undefined
  let retry = 0

  kuro.builder({ dicPath: dicPath }).build(function(err, tok) {
    tokenizer = tok
  })

  const tryRetry = input => {
    if (retry < 5) {
      retry += 1
      return setTimeout(() => this.get(input), 1000)
    }

    throw new Error("Can't load jap dictionnaries")
  }

  return {
    get: input => (tokenizer !== undefined ? tokenizer.tokenize(input).map(x => x.basic_form) : tryRetry(input))
  }
})()

export const tokenize = (input: string, lang: string): string[] => {
  return lang == 'ja' ? tok.get(input) : WhiteSpaceTokenizer(input)
}

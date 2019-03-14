const WhiteSpaceTokenizer = txt => txt.split(' ').filter(x => x.trim().length)

export const tokenize = async (text: string, lang: string) => {
  // TODO Add ML-Based Tokenizer here
  return WhiteSpaceTokenizer(text)
}

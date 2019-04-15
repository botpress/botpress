const WhiteSpaceTokenizer = (txt: string) =>
  txt
    .split(/[^a-zA-Z0-9_]/i)
    .map(x => x.toLowerCase().trim())
    .filter(x => x.trim().length)

export const tokenize = async (text: string, lang: string): Promise<string[]> => {
  // TODO Add ML-Based Tokenizer here
  return WhiteSpaceTokenizer(text)
}

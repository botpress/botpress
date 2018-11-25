const EscapedRegexChars = /[.+?^${}()|[\]\\]/g
const WildcardRegex = /\*/g

export const createIntentMatcher = (intentName: string): ((pattern: string) => boolean) => {
  return (pattern: string) => {
    pattern = pattern.replace(EscapedRegexChars, '\\$&').replace(WildcardRegex, '.+?')
    const matcher = new RegExp('^' + pattern + '$', 'i')
    return matcher.test(intentName)
  }
}

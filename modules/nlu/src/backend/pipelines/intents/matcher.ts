import { escapeRegex } from '../../tools/patterns-utils'

export const createIntentMatcher = (intentName: string): ((pattern: string) => boolean) => {
  return (pattern: string) => {
    const matcher = new RegExp(`^${escapeRegex(pattern)}$`, 'i')
    return matcher.test(intentName)
  }
}

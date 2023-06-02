import _ from 'lodash'

const capitalizeFirstLetter = (text: string) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()

const splitHyphens = (tokens: string[]) => tokens.flatMap((token) => token.split('-'))
const splitUnderscores = (tokens: string[]) => tokens.flatMap((token) => token.split('_'))
const splitCaseChange = (tokens: string[]) => tokens.flatMap((token) => token.split(/(?<=[a-z])(?=[A-Z])/))
const splitTokens = (tokens: string[]) => {
  return [splitHyphens, splitUnderscores, splitCaseChange].reduce((acc, step) => step(acc), tokens)
}

type SupportedCase = `${'pascal' | 'kebab' | 'snake' | 'screamingSnake' | 'camel'}Case`

const fromTokens = {
  pascalCase: (tokens: string[]) => {
    return tokens.map(capitalizeFirstLetter).join('')
  },
  kebabCase: (tokens: string[]) => {
    return tokens.map((token) => token.toLowerCase()).join('-')
  },
  snakeCase: (tokens: string[]) => {
    return tokens.map((token) => token.toLowerCase()).join('_')
  },
  screamingSnakeCase: (tokens: string[]) => {
    return tokens.map((token) => token.toUpperCase()).join('_')
  },
  camelCase: (tokens: string[]) => {
    const [first, ...others] = tokens
    return [first!.toLowerCase(), ...others.map(capitalizeFirstLetter)].join('')
  },
} as Record<SupportedCase, (tokens: string[]) => string>

export const to = _.mapValues(fromTokens, (fn) => (text: string) => {
  const tokens = splitTokens([text])
  return fn(tokens)
}) satisfies Record<SupportedCase, (text: string) => string>

export const is = _.mapValues(to, (fn) => (text: string) => {
  const result = fn(text)
  return result === text
}) satisfies Record<SupportedCase, (text: string) => boolean>

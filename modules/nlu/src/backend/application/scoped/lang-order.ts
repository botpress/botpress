import _ from 'lodash'

type LangToTry = {
  predictedLanguage?: string
  anticipatedLanguage: string
  defaultLanguage: string
}

const isDefined = <T>(x: T | undefined): x is T => {
  return x !== undefined
}

export const getLanguageOrder = (langs: LangToTry, order: string = 'pad'): string[] => {
  const ordering = order.split('')

  return _(ordering)
    .map(o => {
      switch (o) {
        case 'p':
          return langs.predictedLanguage
        case 'a':
          return langs.anticipatedLanguage
        case 'd':
          return langs.defaultLanguage
        default:
          return undefined
      }
    })
    .filter(isDefined)
    .uniq()
    .value()
}

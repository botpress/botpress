export const createMultiLangObject = (questions: { [lang: string]: string }, textProp: string, properties: any) => {
  return Object.keys(questions).reduce((acc, curr) => {
    acc[curr] = {
      [textProp]: questions[curr],
      ...properties
    }
    return acc
  }, {})
}

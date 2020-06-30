/** Takes an object of languages with questions, and will create the correct structure for the new renderer */
export const createMultiLangObject = (
  questions: { [lang: string]: string },
  textProp: string,
  otherProperties: any = {}
) => {
  return Object.keys(questions).reduce((acc, curr) => {
    acc[curr] = {
      [textProp]: questions[curr],
      ...otherProperties
    }
    return acc
  }, {})
}

const DOLLAR_SIGNS_REGEX = /(?<!\\)\$/gm // unescaped dollar sign
const VARIABLE_NAME_REGEX = /^[A-Za-z][\w-]*/ // letter followed by letters, numbers, underscore and dash

export function extractVariables(text: string) {
  const variables: string[] = []

  let match: RegExpExecArray | null
  do {
    match = DOLLAR_SIGNS_REGEX.exec(text)
    if (match) {
      variables.push(_extractVariableName(text, match))
    }
  } while (match)

  return variables
}

export const validateVariableName = (text: string): boolean => {
  const variableNameMatch = VARIABLE_NAME_REGEX.exec(text)
  return !!(variableNameMatch && variableNameMatch[0].length === text.length)
}

const _extractVariableName = (text: string, dollarSignMatch: RegExpExecArray) => {
  const stripped = text.substring(dollarSignMatch.index + 1)
  const variableNameMatch = VARIABLE_NAME_REGEX.exec(stripped)

  if (!variableNameMatch) {
    const errorMsg = `Error while extracting variable from "${text}". \n\
      Rules for variable naming are the following ones: \n\
                      1. Variables names must start with an ascii letter.\n\
                      2. Variables names must contain only letters, numbers, underscores and dashes.\n\
                      3. Variables names are case sensitives.\n\
      If you where not trying to reference a variable, escape any dollar symbol ($) with a back slash (\\).`
    throw new Error(errorMsg)
  }

  return variableNameMatch[0]
}

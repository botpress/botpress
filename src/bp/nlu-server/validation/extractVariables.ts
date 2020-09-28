export default function extractVariables(text: string) {
  // check out unit test to see the regex power
  const variableRegex = /\$[A-Z,a-z][\w|-]*($|\s|\.|\?|\!|,|;|:|'|`|"|~|\/|\\)/gm

  const variables: string[] = []

  let match: RegExpExecArray | null
  do {
    match = variableRegex.exec(text)
    if (match) {
      const variable = match[0].substring(1).replace(/[\s|\.|\?|\!|,|;|:|'|`|"|~|\/|\\]/, '')
      variables.push(variable)
    }
  } while (match)

  return variables
}

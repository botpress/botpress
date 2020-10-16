export default function extractVariables(text: string) {
  // check out unit test to see the regex power
  const variableRegex = /\$[A-Za-z][\w-]*/gm

  const variables: string[] = []

  let match: RegExpExecArray | null
  do {
    match = variableRegex.exec(text)
    if (match) {
      const variable = match[0].substring(1)
      variables.push(variable)
    }
  } while (match)

  return variables
}

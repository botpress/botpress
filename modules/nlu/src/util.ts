export const ID_REGEX = /[\t\s_]/gi

export const sanitizeFilenameNoExt = name =>
  name
    .toLowerCase()
    .replace('.json', '')
    .replace(ID_REGEX, '_')

export const getAllMatchingForRegex = (regex: RegExp) => (input: string): RegExpExecArray[] => {
  const results = []
  let matches: RegExpExecArray | null

  do {
    matches = regex.exec(input)

    if (matches && matches.length > 0) {
      results.push(matches)
    }
  } while (matches)

  return results
}

export const ID_REGEX: RegExp = /[\t\s_]/gi

export const sanitizeFilenameNoExt = (name: string) =>
  name
    .toLowerCase()
    .replace('.json', '')
    .replace(ID_REGEX, '_')

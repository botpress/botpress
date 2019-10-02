export const ID_REGEX = /[\t\s]/gi

export const sanitizeFilenameNoExt = name =>
  name
    .toLowerCase()
    .replace('.json', '')
    .replace(ID_REGEX, '-')

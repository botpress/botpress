export const sanitizeFilenameNoExt = name =>
  name
    .toLowerCase()
    .replace('.json', '')
    .replace(/[^a-z0-9-_]/gi, '_')

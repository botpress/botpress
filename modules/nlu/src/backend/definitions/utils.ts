export const sanitizeFileName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\.json$/i, '')
    .replace(/[\t\s]/gi, '-')
}

const MAX_ROW_NUMBER = 100000

export const constructRangeFromStartColumn = (sheetName: string | undefined, startColumn: string): string => {
  const sheetPrefix = sheetName ? `${sheetName}!` : ''
  return `${sheetPrefix}${startColumn}:${startColumn}${MAX_ROW_NUMBER}`
}

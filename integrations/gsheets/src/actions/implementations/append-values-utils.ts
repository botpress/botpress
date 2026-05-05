const _quoteSheetName = (sheetName: string): string => {
  if (sheetName.startsWith("'") && sheetName.endsWith("'")) {
    return sheetName
  }
  if (/[^A-Za-z0-9_]/.test(sheetName)) {
    const escaped = sheetName.replace(/'/g, "''")
    return `'${escaped}'`
  }
  return sheetName
}

export const constructRangeFromStartColumn = (sheetName: string | undefined, startColumn: string): string => {
  const sheetPrefix = sheetName ? `${_quoteSheetName(sheetName)}!` : ''
  return `${sheetPrefix}${startColumn}:${startColumn}`
}

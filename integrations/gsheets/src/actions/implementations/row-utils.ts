const ASCII_UPPERCASE_A = 65
const BASE_26 = 26

export const columnLetterToIndex = (col: string): number =>
  col
    .toUpperCase()
    .split('')
    .reduce((acc, char) => acc * BASE_26 + char.charCodeAt(0) - ASCII_UPPERCASE_A + 1, 0) - 1

export const indexToColumnLetter = (index: number): string => {
  let letter = ''
  let i = index
  while (i >= 0) {
    letter = String.fromCharCode((i % BASE_26) + ASCII_UPPERCASE_A) + letter
    i = Math.floor(i / BASE_26) - 1
  }
  return letter
}

export const buildSheetPrefix = (sheetTitle?: string): string => {
  if (!sheetTitle) {
    return ''
  }
  const needsQuotes = sheetTitle.includes(' ') || sheetTitle.includes("'")
  return needsQuotes ? `'${sheetTitle.replace(/'/g, "''")}'!` : `${sheetTitle}!`
}

export const buildRowRange = ({
  sheetTitle,
  rowIndex,
  startColumn = 'A',
  endColumn,
}: {
  sheetTitle?: string
  rowIndex: number
  startColumn?: string
  endColumn?: string
}): string => {
  const prefix = buildSheetPrefix(sheetTitle)
  const end = endColumn ? `${endColumn}${rowIndex}` : `${rowIndex}`
  return `${prefix}${startColumn}${rowIndex}:${end}`
}

export const buildColumnRange = ({
  sheetTitle,
  startColumn = 'A',
  endColumn,
  maxRow = 100000,
}: {
  sheetTitle?: string
  startColumn?: string
  endColumn?: string
  maxRow?: number
}): string => {
  const prefix = buildSheetPrefix(sheetTitle)
  const end = endColumn ?? startColumn
  return `${prefix}${startColumn}1:${end}${maxRow}`
}

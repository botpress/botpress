import { sheets_v4 } from 'googleapis'
type GridRange = sheets_v4.Schema$GridRange

export namespace A1Converter {
  const ASCII_UPPERCASE_A = 65
  const BASE_26 = 26
  const COLUMN_INDEX_OFFSET = 1
  const ROW_INDEX_OFFSET = 1

  export const gridRangeToA1 = (range: GridRange): string => {
    if (_isEmptyRange(range)) {
      return ':'
    }

    const start = _getStartReference(range)
    const end = _getEndReference(range)

    return start === end ? start : `${start}:${end}`
  }

  const _isEmptyRange = (range: GridRange): boolean =>
    range.startColumnIndex == null &&
    range.startRowIndex == null &&
    range.endColumnIndex == null &&
    range.endRowIndex == null

  const _getStartReference = (range: GridRange): string =>
    _buildCellReference(range.startColumnIndex, range.startRowIndex)

  const _getEndReference = (range: GridRange): string =>
    _buildCellReference(
      range.endColumnIndex ? range.endColumnIndex - COLUMN_INDEX_OFFSET : undefined,
      range.endRowIndex ? range.endRowIndex - ROW_INDEX_OFFSET : undefined
    )

  const _buildCellReference = (columnIndex?: number | null, rowIndex?: number | null): string => {
    const columnRef = typeof columnIndex === 'number' ? _columnIndexToLetter(columnIndex) : ''
    const rowRef = typeof rowIndex === 'number' ? (rowIndex + ROW_INDEX_OFFSET).toString() : ''

    return `${columnRef}${rowRef}`
  }

  const _columnIndexToLetter = (index: number): string => {
    let letter = ''
    while (index >= 0) {
      letter = String.fromCharCode((index % BASE_26) + ASCII_UPPERCASE_A) + letter
      index = Math.floor(index / BASE_26) - COLUMN_INDEX_OFFSET
    }
    return letter
  }
}

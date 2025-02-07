import * as sdk from '@botpress/sdk'

export type RangeIndices = {
  startRowIndex?: number
  endRowIndex?: number
  startColumnIndex?: number
  endColumnIndex?: number
}

export class InvalidA1NotationError extends sdk.RuntimeError {
  public constructor(message: string) {
    super(`Error while parsing A1 notation: ${message}`)
  }
}

export namespace A1NotationParser {
  const COLUMN_PATTERN = /^[A-Za-z]+$/
  const ROW_PATTERN = /^\d+$/
  const CELL_PATTERN = /^([A-Za-z]*)(\d*)$/
  const BASE_26 = 26
  const ASCII_UPPERCASE_A = 65
  const COLUMN_INDEX_OFFSET = 1
  const ROW_INDEX_OFFSET = 1

  type Cell = {
    row: number | null
    col: number | null
  }

  export const parse = (range: string): RangeIndices => {
    _assertRangeNotEmpty(range)

    const rangePart = range.split('!').pop()
    _assertRangePartNotEmpty(rangePart)

    const [start, end = ''] = rangePart.split(':')
    _assertStartNotEmpty(start)

    const startCell = _parseCell(start)
    _assertValidCellReference(startCell, start)

    const endCell = end ? _parseCell(end) : startCell
    if (end) {
      _assertValidCellReference(endCell, end)
    }

    return _applyRangeRules(start, end, _createRanges(startCell, endCell))
  }

  const _assertRangeNotEmpty = (range?: string) => {
    if (!range) {
      throw new InvalidA1NotationError('Range cannot be empty')
    }
  }

  const _assertRangePartNotEmpty: (rangePart?: string) => asserts rangePart is string = (rangePart) => {
    if (!rangePart) {
      throw new InvalidA1NotationError('Range part cannot be empty')
    }
  }

  const _assertStartNotEmpty: (start?: string) => asserts start is string = (start) => {
    if (!start) {
      throw new InvalidA1NotationError('Start cell reference cannot be empty')
    }
  }

  const _assertValidCellReference = (cell: Cell, reference: string) => {
    if (cell.row === null && cell.col === null) {
      throw new InvalidA1NotationError(`Invalid cell reference: ${reference}`)
    }
  }

  const _createRanges = (start: Cell, end: Cell): RangeIndices => ({
    ..._createColumnRanges(start, end),
    ..._createRowRanges(start, end),
  })

  const _createColumnRanges = ({ col: startCol }: Cell, { col: endCol }: Cell): RangeIndices =>
    startCol === null ? {} : { startColumnIndex: startCol, endColumnIndex: (endCol ?? startCol) + COLUMN_INDEX_OFFSET }

  const _createRowRanges = ({ row: startRow }: Cell, { row: endRow }: Cell): RangeIndices =>
    startRow === null ? {} : { startRowIndex: startRow, endRowIndex: (endRow ?? startRow) + ROW_INDEX_OFFSET }

  const _applyRangeRules = (start: string, end: string, ranges: RangeIndices): RangeIndices =>
    !end
      ? ranges
      : _isColumnOnlyRange(start, end)
        ? _extractColumnRange(ranges)
        : _isRowOnlyRange(start, end)
          ? _extractRowRange(ranges)
          : _applyOpenEndedRule(end, ranges)

  const _isColumnOnlyRange = (start: string, end: string): boolean =>
    COLUMN_PATTERN.test(start) && COLUMN_PATTERN.test(end)

  const _isRowOnlyRange = (start: string, end: string): boolean => ROW_PATTERN.test(start) && ROW_PATTERN.test(end)

  const _extractColumnRange = ({ startColumnIndex, endColumnIndex }: RangeIndices): RangeIndices => ({
    startColumnIndex,
    endColumnIndex,
  })

  const _extractRowRange = ({ startRowIndex, endRowIndex }: RangeIndices): RangeIndices => ({
    startRowIndex,
    endRowIndex,
  })

  const _applyOpenEndedRule = (end: string, ranges: RangeIndices): RangeIndices =>
    COLUMN_PATTERN.test(end) ? { ...ranges, endRowIndex: undefined } : ranges

  const _parseCell = (cell: string): Cell => {
    const match = CELL_PATTERN.exec(cell)
    _assertValidCellFormat(match, cell)

    const [, colPart, rowPart] = match
    return {
      row: rowPart ? +rowPart - ROW_INDEX_OFFSET : null,
      col: colPart ? _columnToIndex(colPart) : null,
    }
  }

  const _assertValidCellFormat: (match: RegExpExecArray | null, cell: string) => asserts match is RegExpExecArray = (
    match,
    cell
  ) => {
    if (!match) {
      throw new InvalidA1NotationError(`Invalid cell format: ${cell}`)
    }
  }

  const _columnToIndex = (col: string): number =>
    col
      .toUpperCase()
      .split('')
      .reduce((acc, char) => acc * BASE_26 + char.charCodeAt(0) - ASCII_UPPERCASE_A + COLUMN_INDEX_OFFSET, 0) -
    COLUMN_INDEX_OFFSET
}

import type { sheets_v4 } from 'googleapis'
import { A1Converter } from '../a1-notation-utils/a1-converter'

export namespace ResponseMapping {
  export const mapValueRange = (response: sheets_v4.Schema$ValueRange) =>
    ({
      range: response.range ?? '',
      majorDimension: response.majorDimension === 'COLUMNS' ? 'COLUMNS' : 'ROWS',
      values: _stringifyValues(response.values ?? []),
    }) as const

  export const mapUpdateValues = (response: sheets_v4.Schema$UpdateValuesResponse) =>
    ({
      spreadsheetId: response.spreadsheetId ?? '',
      updatedRange: response.updatedRange ?? '',
      updatedRows: response.updatedRows ?? 0,
      updatedColumns: response.updatedColumns ?? 0,
      updatedCells: response.updatedCells ?? 0,
    }) as const

  export const mapAppendValues = (response: sheets_v4.Schema$AppendValuesResponse) =>
    ({
      spreadsheetId: response.spreadsheetId ?? '',
      tableRange: response.tableRange ?? '',
      updates: mapUpdateValues(response.updates ?? {}),
    }) as const

  export const mapClearValues = (response: sheets_v4.Schema$ClearValuesResponse) =>
    ({
      spreadsheetId: response.spreadsheetId ?? '',
      clearedRange: response.clearedRange ?? '',
    }) as const

  export const mapAddSheet = (response: sheets_v4.Schema$BatchUpdateSpreadsheetResponse) =>
    ({
      spreadsheetId: response.spreadsheetId ?? '',
      newSheet: mapSheet(response.replies?.[0]?.addSheet ?? {}),
    }) as const

  export const mapSheet = (sheet: sheets_v4.Schema$Sheet) =>
    ({
      sheetId: sheet.properties?.sheetId ?? 0,
      title: sheet.properties?.title ?? '',
      index: sheet.properties?.index ?? 0,
      isHidden: sheet.properties?.hidden ?? false,
      hasProtectedRanges: (sheet.protectedRanges?.length ?? 0) > 0,
      isFullyProtected: sheet.protectedRanges?.every((range) => range.unprotectedRanges === undefined) ?? false,
    }) as const

  export const mapNamedRange = (namedRange: sheets_v4.Schema$NamedRange) =>
    ({
      namedRangeId: namedRange.namedRangeId ?? '',
      name: namedRange.name ?? '',
      range: A1Converter.gridRangeToA1(namedRange.range ?? {}),
      sheetId: namedRange.range?.sheetId ?? 0,
    }) as const

  export const mapProtectedRange = (protectedRange: sheets_v4.Schema$ProtectedRange) =>
    ({
      protectedRangeId: protectedRange.protectedRangeId ?? 0,
      namedRangeId: protectedRange.namedRangeId ?? '',
      range: A1Converter.gridRangeToA1(protectedRange.range ?? {}),
      sheetId: protectedRange.range?.sheetId ?? 0,
      description: protectedRange.description ?? '',
      warningOnly: protectedRange.warningOnly ?? false,
      requestingUserCanEdit: protectedRange.requestingUserCanEdit ?? false,
    }) as const
}

const _stringifyValues = (values: any[][]) => values.map((majorDimension) => majorDimension.map(String))

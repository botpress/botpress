import type { sheets_v4 } from 'googleapis'

export namespace ResponseMapping {
  export const mapValueRange = (response: sheets_v4.Schema$ValueRange) =>
    ({
      range: response.range ?? '',
      majorDimension: response.majorDimension ?? 'ROWS',
      values: _stringifyValues(response.values ?? []),
    } as const)

  export const mapUpdateValues = (response: sheets_v4.Schema$UpdateValuesResponse) =>
    ({
      spreadsheetId: response.spreadsheetId ?? '',
      updatedRange: response.updatedRange ?? '',
      updatedRows: response.updatedRows ?? 0,
      updatedColumns: response.updatedColumns ?? 0,
      updatedCells: response.updatedCells ?? 0,
    } as const)

  export const mapAppendValues = (response: sheets_v4.Schema$AppendValuesResponse) =>
    ({
      spreadsheetId: response.spreadsheetId ?? '',
      tableRange: response.tableRange ?? '',
      updates: mapUpdateValues(response.updates ?? {}),
    } as const)

  export const mapClearValues = (response: sheets_v4.Schema$ClearValuesResponse) =>
    ({
      spreadsheetId: response.spreadsheetId ?? '',
      clearedRange: response.clearedRange ?? '',
    } as const)

  export const mapAddSheet = (response: sheets_v4.Schema$BatchUpdateSpreadsheetResponse) =>
    ({
      spreadsheetId: response.spreadsheetId ?? '',
      newSheet: {
        sheetId: response.replies?.[0]?.addSheet?.properties?.sheetId ?? 0,
        title: response.replies?.[0]?.addSheet?.properties?.title ?? '',
        index: response.replies?.[0]?.addSheet?.properties?.index ?? 0,
        isHidden: response.replies?.[0]?.addSheet?.properties?.hidden ?? false,
      },
    } as const)
}

const _stringifyValues = (values: any[][]) => values.map((majorDimension) => majorDimension.map(String))

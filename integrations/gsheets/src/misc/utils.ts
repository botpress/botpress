import { GoogleSheetsApi } from 'src/client'

type SpreadsheetData = Awaited<ReturnType<GoogleSheetsApi['getSpreadsheet']>>

export const summarizeSpreadsheet = (spreadsheet: SpreadsheetData) => {
  const title = spreadsheet.properties?.title
  if (!title) {
    return 'No Title'
  }

  const sheetsTitles = spreadsheet.sheets?.map((sheet) => sheet.properties?.title).filter(Boolean)
  if (!sheetsTitles?.length) {
    return `spreadsheet "${title}"`
  }

  return `spreadsheet "${title}" with sheets "${sheetsTitles.join('", "')}"`
}

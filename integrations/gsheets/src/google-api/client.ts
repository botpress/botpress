import { JWT } from 'google-auth-library'
import { google, sheets_v4 } from 'googleapis'
import { MajorDimension } from '../../definitions/actions'
import * as bp from '.botpress'

export function getClient(config: bp.Context['configuration']) {
  return new GoogleSheetsApi(config.spreadsheetId, config.privateKey, config.clientEmail)
}

export class GoogleSheetsApi {
  private _sheets: sheets_v4.Sheets
  private _spreadsheetId: string

  public constructor(spreadsheetId: string, privateKey: string, clientEmail: string) {
    this._spreadsheetId = spreadsheetId

    const jwtClient = new JWT({
      email: clientEmail,
      key: privateKey.split(String.raw`\n`).join('\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    this._sheets = google.sheets({ version: 'v4', auth: jwtClient })
  }

  public async getValues(range: string, majorDimension?: MajorDimension): Promise<sheets_v4.Schema$ValueRange> {
    const response = await this._sheets.spreadsheets.values.get({
      spreadsheetId: this._spreadsheetId,
      range,
      majorDimension: majorDimension ?? 'ROWS',
    })
    return response.data
  }

  public async updateValues(
    range: string,
    values: any[][],
    majorDimension?: MajorDimension
  ): Promise<sheets_v4.Schema$UpdateValuesResponse> {
    const response = await this._sheets.spreadsheets.values.update({
      spreadsheetId: this._spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { range, values, majorDimension },
    })
    return response.data
  }

  public async appendValues(
    range: string,
    values: any[][],
    majorDimension?: MajorDimension
  ): Promise<sheets_v4.Schema$AppendValuesResponse> {
    const response = await this._sheets.spreadsheets.values.append({
      spreadsheetId: this._spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { range, values, majorDimension },
    })
    return response.data
  }

  public async clearValues(
    range: string,
    majorDimension?: MajorDimension
  ): Promise<sheets_v4.Schema$ClearValuesResponse> {
    const response = await this._sheets.spreadsheets.values.clear({
      spreadsheetId: this._spreadsheetId,
      range,
      requestBody: { range, majorDimension },
    })
    return response.data
  }

  public async batchUpdate(
    requests: sheets_v4.Schema$Request[]
  ): Promise<sheets_v4.Schema$BatchUpdateSpreadsheetResponse> {
    const response = await this._sheets.spreadsheets.batchUpdate({
      spreadsheetId: this._spreadsheetId,
      requestBody: { requests },
    })
    return response.data
  }

  public async getSpreadsheet(fields?: string): Promise<sheets_v4.Schema$Spreadsheet> {
    const response = await this._sheets.spreadsheets.get({
      spreadsheetId: this._spreadsheetId,
      fields,
    })
    return response.data
  }

  public async getSpreadsheetSummary(): Promise<string> {
    const { properties, sheets } = await this.getSpreadsheet()

    const title = properties?.title ?? 'No Title'
    const sheetsTitles = sheets?.map((sheet) => sheet.properties?.title).filter(Boolean) ?? []

    return `spreadsheet "${title}"` + (sheetsTitles.length ? ` with sheets "${sheetsTitles.join('", "')}"` : '')
  }
}

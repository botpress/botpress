import { JWT } from 'google-auth-library'
import { google, sheets_v4 } from 'googleapis'
import { Configuration } from './misc/types'

export function getClient(config: Configuration) {
  return new GoogleSheetsApi(config.spreadsheetId, config.privateKey, config.clientEmail)
}

export class GoogleSheetsApi {
  private sheets: sheets_v4.Sheets
  private spreadsheetId: string

  constructor(spreadsheetId: string, privateKey: string, clientEmail: string) {
    this.spreadsheetId = spreadsheetId

    const jwtClient = new JWT({
      email: clientEmail,
      key: privateKey.split(String.raw`\n`).join('\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    this.sheets = google.sheets({ version: 'v4', auth: jwtClient })
  }

  async getValues(range: string): Promise<sheets_v4.Schema$ValueRange> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range,
    })
    return response.data
  }

  async updateValues(range: string, values: any[][]): Promise<sheets_v4.Schema$UpdateValuesResponse> {
    const response = await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    })
    return response.data
  }

  async appendValues(range: string, values: any[][]): Promise<sheets_v4.Schema$AppendValuesResponse> {
    const response = await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    })
    return response.data
  }

  async clearValues(range: string): Promise<sheets_v4.Schema$ClearValuesResponse> {
    const response = await this.sheets.spreadsheets.values.clear({
      spreadsheetId: this.spreadsheetId,
      range,
    })
    return response.data
  }

  async batchUpdate(requests: sheets_v4.Schema$Request[]): Promise<sheets_v4.Schema$BatchUpdateSpreadsheetResponse> {
    const response = await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: { requests },
    })
    return response.data
  }

  async getSpreadsheet(fields: string): Promise<sheets_v4.Schema$Spreadsheet> {
    const response = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
      fields,
    })
    return response.data
  }
}

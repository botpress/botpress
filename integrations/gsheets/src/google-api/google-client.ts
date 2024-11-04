import { google } from 'googleapis'
import { MajorDimension } from '../../definitions/actions'
import * as bp from '.botpress'
import { handleErrorsDecorator as handleErrors } from './error-handling'

type GoogleSheetsClient = ReturnType<typeof google.sheets>
type GoogleDriveClient = ReturnType<typeof google.drive>
type GoogleOAuth2Client = InstanceType<(typeof google.auth)['OAuth2']>

export const getClient = async ({ ctx }: { ctx: bp.Context }) => {
  const scopes = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.readonly']

  const oauthClient: GoogleOAuth2Client =
    ctx.configurationType === null
      ? new google.auth.OAuth2() // TODO: get refresh token
      : new google.auth.JWT({
          email: ctx.configuration.clientEmail,
          key: ctx.configuration.privateKey.split(String.raw`\n`).join('\n'),
          scopes,
        })

  return new GoogleClient({
    oauthClient,
    spreadsheetId: ctx.configuration.spreadsheetId,
    webhookUrl: `${process.env.BP_WEBHOOK_URL}/${ctx.webhookId}`,
    webhookSecret: 'TODO', // TODO: get or generate webhook secret
  })
}

type Range = { rangeA1: string; majorDimension?: MajorDimension }
type ValueRange = { values: any[][] } & Range

class GoogleClient {
  private readonly _sheetsClient: GoogleSheetsClient
  private readonly _driveClient: GoogleDriveClient
  private readonly _spreadsheetId: string
  private readonly _webhookUrl: string
  private readonly _webhookSecret: string

  public constructor({
    spreadsheetId,
    oauthClient,
    webhookUrl,
    webhookSecret,
  }: {
    spreadsheetId: string
    oauthClient: GoogleOAuth2Client
    webhookUrl: string
    webhookSecret: string
  }) {
    this._spreadsheetId = spreadsheetId
    this._webhookUrl = webhookUrl
    this._webhookSecret = webhookSecret

    this._sheetsClient = google.sheets({ version: 'v4', auth: oauthClient })
    this._driveClient = google.drive({ version: 'v3', auth: oauthClient })
  }

  @handleErrors('Failed to watch spreadsheet')
  public async watchSpreadsheet() {
    await this._driveClient.files.watch({
      fileId: this._spreadsheetId,
      requestBody: {
        ...this._getWebhookId(),
        type: 'webhook',
        address: this._webhookUrl,
        payload: true,
        token: this._webhookSecret,
      },
    })
  }

  @handleErrors('Failed to stop watching spreadsheet')
  public async stopWatchingSpreadsheet() {
    await this._driveClient.channels.stop({
      requestBody: { ...this._getWebhookId() },
    })
  }

  @handleErrors('Failed to get values from spreadsheet range')
  public async getValuesFromSpreadsheetRange({ rangeA1, majorDimension }: Range) {
    const response = await this._sheetsClient.spreadsheets.values.get({
      spreadsheetId: this._spreadsheetId,
      range: rangeA1,
      majorDimension: majorDimension ?? 'ROWS',
    })
    return response.data
  }

  @handleErrors('Failed to update values in spreadsheet range')
  public async updateValuesInSpreadsheetRange({ rangeA1, values, majorDimension }: ValueRange) {
    const response = await this._sheetsClient.spreadsheets.values.update({
      spreadsheetId: this._spreadsheetId,
      range: rangeA1,
      valueInputOption: 'USER_ENTERED',
      requestBody: { range: rangeA1, values, majorDimension },
    })
    return response.data
  }

  @handleErrors('Failed to append values to spreadsheet range')
  public async appendValuesToSpreadsheetRange({ rangeA1, values, majorDimension }: ValueRange) {
    const response = await this._sheetsClient.spreadsheets.values.append({
      spreadsheetId: this._spreadsheetId,
      range: rangeA1,
      valueInputOption: 'USER_ENTERED',
      requestBody: { range: rangeA1, values, majorDimension },
    })
    return response.data
  }

  @handleErrors('Failed to clear values from spreadsheet range')
  public async clearValuesFromSpreadsheetRange({ rangeA1, majorDimension }: Range) {
    const response = await this._sheetsClient.spreadsheets.values.clear({
      spreadsheetId: this._spreadsheetId,
      range: rangeA1,
      requestBody: { range: rangeA1, majorDimension },
    })
    return response.data
  }

  @handleErrors('Failed to create new sheet in spreadsheet')
  public async createNewSheetInSpreadsheet({ sheetTitle }: { sheetTitle: string }) {
    const response = await this._sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId: this._spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetTitle,
              },
            },
          },
        ],
      },
    })
    return response.data
  }

  @handleErrors('Failed to get spreadsheet metadata')
  public async getSpreadsheetMetadata({ fields }: { fields?: string } = {}) {
    const response = await this._sheetsClient.spreadsheets.get({
      spreadsheetId: this._spreadsheetId,
      fields,
    })
    return response.data
  }

  public async getSpreadsheetSummary(): Promise<string> {
    const { properties, sheets } = await this.getSpreadsheetMetadata()

    const title = properties?.title ?? 'No Title'
    const sheetsTitles = sheets?.map((sheet) => sheet.properties?.title).filter(Boolean) ?? []

    return `spreadsheet "${title}"` + (sheetsTitles.length ? ` with sheets "${sheetsTitles.join('", "')}"` : '')
  }

  private _getWebhookId() {
    return { id: `sheets-watch-${this._spreadsheetId}`, resourceId: this._spreadsheetId } as const
  }
}

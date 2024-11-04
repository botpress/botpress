import { google } from 'googleapis'
import { MajorDimension } from '../../definitions/actions'
import { handleErrorsDecorator as handleErrors } from './error-handling'
import { getAuthenticatedOAuth2Client, exchangeAuthCodeAndSaveRefreshToken } from './oauth-client'
import * as bp from '.botpress'

type GoogleSheetsClient = ReturnType<typeof google.sheets>
type GoogleDriveClient = ReturnType<typeof google.drive>
type GoogleOAuth2Client = InstanceType<(typeof google.auth)['OAuth2']>

type Range = { rangeA1: string; majorDimension?: MajorDimension }
type ValueRange = { values: any[][] } & Range

export class GoogleClient {
  private readonly _sheetsClient: GoogleSheetsClient
  private readonly _driveClient: GoogleDriveClient
  private readonly _spreadsheetId: string

  private constructor({ spreadsheetId, oauthClient }: { spreadsheetId: string; oauthClient: GoogleOAuth2Client }) {
    this._spreadsheetId = spreadsheetId

    this._sheetsClient = google.sheets({ version: 'v4', auth: oauthClient })
    this._driveClient = google.drive({ version: 'v3', auth: oauthClient })
  }

  public static async create({ ctx, client }: { ctx: bp.Context; client: bp.Client }) {
    const oauth2Client = await getAuthenticatedOAuth2Client({ ctx, client })

    return new GoogleClient({
      oauthClient: oauth2Client,
      spreadsheetId: ctx.configuration.spreadsheetId,
    })
  }

  public static async authenticateWithAuthorizationCode({
    ctx,
    client,
    authorizationCode,
  }: {
    ctx: bp.Context
    client: bp.Client
    authorizationCode: string
  }) {
    await exchangeAuthCodeAndSaveRefreshToken({ ctx, client, authorizationCode })
  }

  @handleErrors('Failed to get about')
  public async getNameAndAvatarOfDriveUser() {
    const { data } = await this._driveClient.about.get({ fields: 'user' })

    return {
      name: data.user?.displayName ?? undefined,
      pictureUrl: data.user?.photoLink ?? undefined,
    }
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
}

import { google } from 'googleapis'
import { MajorDimension } from '../../definitions/actions'
import { A1NotationParser } from './a1-notation-utils/a1-parser'
import { handleErrorsDecorator as handleErrors } from './error-handling'
import { ResponseMapping } from './mapping/response-mapping'
import { getAuthenticatedOAuth2Client, exchangeAuthCodeAndSaveRefreshToken } from './oauth-client'
import * as bp from '.botpress'

type GoogleSheetsClient = ReturnType<typeof google.sheets>
type GoogleOAuth2Client = InstanceType<(typeof google.auth)['OAuth2']>

type RangeOnly = { rangeA1: string }
type Range = { majorDimension?: MajorDimension } & RangeOnly
type ValueRange = { values: any[][] } & Range

export class GoogleClient {
  private readonly _sheetsClient: GoogleSheetsClient
  private readonly _spreadsheetId: string

  private constructor({ spreadsheetId, oauthClient }: { spreadsheetId: string; oauthClient: GoogleOAuth2Client }) {
    this._spreadsheetId = spreadsheetId

    this._sheetsClient = google.sheets({ version: 'v4', auth: oauthClient })
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

  @handleErrors('Failed to get values from spreadsheet range')
  public async getValuesFromSpreadsheetRange({ rangeA1, majorDimension }: Range) {
    const response = await this._sheetsClient.spreadsheets.values.get({
      spreadsheetId: this._spreadsheetId,
      range: rangeA1,
      majorDimension: majorDimension ?? 'ROWS',
    })
    return ResponseMapping.mapValueRange(response.data)
  }

  @handleErrors('Failed to update values in spreadsheet range')
  public async updateValuesInSpreadsheetRange({ rangeA1, values, majorDimension }: ValueRange) {
    const response = await this._sheetsClient.spreadsheets.values.update({
      spreadsheetId: this._spreadsheetId,
      range: rangeA1,
      valueInputOption: 'USER_ENTERED',
      requestBody: { range: rangeA1, values, majorDimension },
    })
    return ResponseMapping.mapUpdateValues(response.data)
  }

  @handleErrors('Failed to append values to spreadsheet range')
  public async appendValuesToSpreadsheetRange({ rangeA1, values, majorDimension }: ValueRange) {
    const response = await this._sheetsClient.spreadsheets.values.append({
      spreadsheetId: this._spreadsheetId,
      range: rangeA1,
      valueInputOption: 'USER_ENTERED',
      requestBody: { range: rangeA1, values, majorDimension },
    })
    return ResponseMapping.mapAppendValues(response.data)
  }

  @handleErrors('Failed to clear values from spreadsheet range')
  public async clearValuesFromSpreadsheetRange({ rangeA1 }: RangeOnly) {
    const response = await this._sheetsClient.spreadsheets.values.clear({
      spreadsheetId: this._spreadsheetId,
      range: rangeA1,
      requestBody: { range: rangeA1 },
    })
    return ResponseMapping.mapClearValues(response.data)
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
    return ResponseMapping.mapAddSheet(response.data)
  }

  @handleErrors('Failed to get sheets from spreadsheet')
  public async getAllSheetsInSpreadsheet() {
    const meta = await this.getSpreadsheetMetadata({
      fields: 'sheets.properties,sheets.protectedRanges.unprotectedRanges',
    })
    return meta.sheets?.map(ResponseMapping.mapSheet) ?? []
  }

  @handleErrors('Failed to delete sheet from spreadsheet')
  public async deleteSheetFromSpreadsheet({ sheetId }: { sheetId: number }) {
    await this._sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId: this._spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteSheet: {
              sheetId,
            },
          },
        ],
      },
    })
  }

  @handleErrors('Failed to rename sheet in spreadsheet')
  public async renameSheetInSpreadsheet({ sheetId, newTitle }: { sheetId: number; newTitle: string }) {
    await this._sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId: this._spreadsheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId,
                title: newTitle,
              },
              fields: 'title',
            },
          },
        ],
      },
    })
  }

  @handleErrors('Failed to set sheet visibility')
  public async setSheetVisibility({ sheetId, isHidden }: { sheetId: number; isHidden: boolean }) {
    await this._sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId: this._spreadsheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId,
                hidden: isHidden,
              },
              fields: 'hidden',
            },
          },
        ],
      },
    })
  }

  @handleErrors('Failed to move sheet to new index')
  public async moveSheetToIndex({ sheetId, newIndex }: { sheetId: number; newIndex: number }) {
    await this._sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId: this._spreadsheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId,
                index: newIndex,
              },
              fields: 'index',
            },
          },
        ],
      },
    })
  }

  @handleErrors('Failed to get spreadsheet metadata')
  public async getSpreadsheetMetadata({ fields }: { fields?: string } = {}) {
    const response = await this._sheetsClient.spreadsheets.get({
      spreadsheetId: this._spreadsheetId,
      fields,
    })
    return response.data
  }

  @handleErrors('Failed to get named ranges of spreadsheet')
  public async getNamedRanges() {
    const response = await this._sheetsClient.spreadsheets.get({
      spreadsheetId: this._spreadsheetId,
      fields: 'namedRanges',
    })

    return response.data.namedRanges?.map(ResponseMapping.mapNamedRange) ?? []
  }

  @handleErrors('Failed to get protected ranges of spreadsheet')
  public async getProtectedRanges() {
    const response = await this._sheetsClient.spreadsheets.get({
      spreadsheetId: this._spreadsheetId,
      fields: 'sheets.protectedRanges',
    })

    return (
      response.data.sheets?.flatMap((sheet) => sheet.protectedRanges?.map(ResponseMapping.mapProtectedRange) ?? []) ??
      []
    )
  }

  @handleErrors('Failed to protect named range')
  public async protectNamedRange({
    namedRangeId,
    requestingUserCanEdit,
    warningOnly,
  }: {
    namedRangeId: string
    requestingUserCanEdit?: boolean
    warningOnly?: boolean
  }) {
    const reponse = await this._sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId: this._spreadsheetId,
      requestBody: {
        requests: [
          {
            addProtectedRange: {
              protectedRange: { namedRangeId, requestingUserCanEdit, warningOnly },
            },
          },
        ],
      },
    })

    const protectedRangeId = reponse.data.replies?.[0]?.addProtectedRange?.protectedRange?.protectedRangeId ?? 0
    return { protectedRangeId }
  }

  @handleErrors('Failed to unprotect named range')
  public async unprotectRange({ protectedRangeId }: { protectedRangeId: number }) {
    await this._sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId: this._spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteProtectedRange: {
              protectedRangeId,
            },
          },
        ],
      },
    })
  }

  @handleErrors('Failed to create named range in sheet')
  public async createNamedRangeInSheet({
    sheetId,
    rangeName,
    a1Notation,
  }: {
    sheetId: number
    rangeName: string
    a1Notation: string
  }) {
    const response = await this._sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId: this._spreadsheetId,
      requestBody: {
        requests: [
          {
            addNamedRange: {
              namedRange: {
                name: rangeName,
                range: {
                  sheetId,
                  ...A1NotationParser.parse(a1Notation),
                },
              },
            },
          },
        ],
      },
    })

    const namedRangeId = response.data.replies?.[0]?.addNamedRange?.namedRange?.namedRangeId ?? ''
    return { namedRangeId }
  }

  public async getSpreadsheetSummary(): Promise<string> {
    const { properties, sheets } = await this.getSpreadsheetMetadata()

    const title = properties?.title ?? 'No Title'
    const sheetsTitles = sheets?.map((sheet) => sheet.properties?.title).filter(Boolean) ?? []

    return `spreadsheet "${title}"` + (sheetsTitles.length ? ` with sheets "${sheetsTitles.join('", "')}"` : '')
  }
}

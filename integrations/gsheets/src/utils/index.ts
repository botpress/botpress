import { Config } from '../misc/types'
import { GoogleSheetsApi } from '../client'

export function getClient(config: Config) {
  return new GoogleSheetsApi(
    config.spreadsheetId,
    config.privateKey,
    config.clientEmail
  )
}

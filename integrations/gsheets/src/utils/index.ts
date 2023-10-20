import { GoogleSheetsApi } from '../client'
import { Config } from '../misc/types'

export function getClient(config: Config) {
  return new GoogleSheetsApi(config.spreadsheetId, config.privateKey, config.clientEmail)
}

import actions from './actions'
import { getClient, GoogleSheetsApi } from './client'
import * as bp from '.botpress'

type SpreadsheetData = Awaited<ReturnType<GoogleSheetsApi['getSpreadsheet']>>
const summarizeSpreadsheet = (spreadsheet: SpreadsheetData) => {
  const title = spreadsheet.properties?.title
  if (!title) {
    return 'No Title'
  }

  let summary = `spreadsheet "${title}"`
  const sheets = spreadsheet.sheets
  if (!sheets) {
    return summary
  }

  const sheetsTitles = sheets.map((sheet) => sheet.properties?.title).filter((x): x is string => !!x)
  if (!sheetsTitles.length) {
    return summary
  }

  summary += ` with sheets "${sheetsTitles.join('", "')}" `
  return summary
}

export default new bp.Integration({
  register: async (props) => {
    props.logger.forBot().info('Registering Google Sheets integration')
    try {
      const gsheetsClient = getClient(props.ctx.configuration)
      const spreadsheet = await gsheetsClient.getSpreadsheet('')
      const summary = summarizeSpreadsheet(spreadsheet)
      props.logger.forBot().info(`Successfully connected to Google Sheets: ${summary}`)
    } catch (thrown) {
      props.logger.forBot().error(`Failed to connect to Google Sheets: ${thrown}`)
      throw thrown
    }
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {},
})

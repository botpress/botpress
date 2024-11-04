import { GoogleClient } from './google-api/google-client'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ logger, ctx, client }) => {
  logger.forBot().info('Registering Google Sheets integration')

  const gsheetsClient = await GoogleClient.create({ ctx, client })
  const summary = await gsheetsClient.getSpreadsheetSummary()
  logger.forBot().info(`Successfully connected to Google Sheets: ${summary}`)

  const { name, pictureUrl } = await gsheetsClient.getNameAndAvatarOfDriveUser()

  await client.updateUser({
    id: ctx.botUserId,
    name,
    pictureUrl,
    tags: {},
  })
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {}

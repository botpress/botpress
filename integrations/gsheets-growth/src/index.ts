import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { GoogleSheetsClient } from './client'
import { syncKb } from './actions'
import { deleteKbFiles } from './misc/kb'

export default new bp.Integration({
  register: async ({ ctx, client, logger }) => {
    const { sheetsUrl } = ctx.configuration

    if (!sheetsUrl) {
      throw new sdk.RuntimeError('Missing required configuration: sheetsUrl')
    }

    const sheetsClient = new GoogleSheetsClient()

    const isValidAccess = await sheetsClient.validateAccess(sheetsUrl)
    if (!isValidAccess) {
      throw new sdk.RuntimeError(
        'Cannot access the specified Google Sheet. Please ensure the sheet is publicly accessible.'
      )
    }

    logger.forBot().info('Google Sheets integration registered successfully, triggering initial sync')

    await syncKb({
      ctx,
      client,
      logger,
      input: {},
      type: 'syncKb',
      metadata: { setCost: (_cost: number) => {} },
    })
  },
  unregister: async ({ client, logger }) => {
    logger.forBot().info('Unregistering Google Sheets integration')

    try {
      await deleteKbFiles('kb-default', client, logger)
      logger.forBot().info('Google Sheets integration unregistered and KB files deleted successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.forBot().error('Failed to delete Google Sheets KB files during unregistration', {
        error: errorMessage,
        kbId: 'kb-default',
      })
      throw new sdk.RuntimeError(`Google Sheets integration cleanup failed: ${errorMessage}`)
    }
  },
  actions: {
    syncKb,
  },
  channels: {},
  handler: async () => {},
})

import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { getAllowedSpreadsheetIds } from 'src/google-api/spreadsheet-selection'
import * as bp from '.botpress'

export const saveSpreadsheetSelectionStep: oauthWizard.WizardStepHandler<bp.HandlerProps> = async ({
  responses,
  query,
  client,
  ctx,
  logger,
}) => {
  // Selection order is preserved: the first id is the default spreadsheet.
  const spreadsheetIds = [
    ...new Set(
      (query.get('spreadsheetIds') ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    ),
  ]

  // A re-authorization without a new pick keeps the previous selection.
  const hasSelection = spreadsheetIds.length > 0 || (await getAllowedSpreadsheetIds({ ctx, client })).length > 0

  if (!hasSelection) {
    // The drive.file scope only grants access to picked spreadsheets, so an
    // installation without a selection cannot reach any spreadsheet.
    logger.forBot().warn('OAuth wizard completed without a spreadsheet selection')
    return responses.endWizard({
      success: false,
      errorMessage:
        'No spreadsheet was selected. The integration can only access the spreadsheets you pick, so run the setup again and select at least one spreadsheet.',
    })
  }

  try {
    if (spreadsheetIds.length) {
      await client.setState({
        id: ctx.integrationId,
        type: 'integration',
        name: 'spreadsheetConfig',
        payload: { spreadsheetIds },
      })
    }

    // Marks the integration as connected in the UI, so it must only happen once
    // the installation is usable.
    await client.configureIntegration({
      identifier: ctx.webhookId,
    })
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    logger.forBot().error('Failed to save the selected spreadsheets:', error)

    return responses.endWizard({
      success: false,
      errorMessage: `Failed to save your spreadsheet selection: ${error.message}`,
    })
  }

  return responses.endWizard({
    success: true,
  })
}

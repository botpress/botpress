import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

/**
 * The spreadsheets this installation is allowed to reach, in selection order.
 * The first one is the default used by actions that don't specify a spreadsheet.
 *
 * Returns an empty array when the OAuth wizard's file picker was skipped.
 */
export const getAllowedSpreadsheetIds = async ({
  ctx,
  client,
}: {
  ctx: bp.Context
  client: bp.Client
}): Promise<string[]> => {
  if (ctx.configurationType === 'serviceAccountKey') {
    return [ctx.configuration.spreadsheetId]
  }

  const result = await client
    .getState({ id: ctx.integrationId, type: 'integration', name: 'spreadsheetConfig' })
    .catch(() => null)

  if (!result) {
    return []
  }

  const { spreadsheetIds, spreadsheetId } = result.state.payload

  if (spreadsheetIds?.length) {
    return spreadsheetIds
  }

  // Installations set up before multi-select only ever wrote the singular field.
  return spreadsheetId ? [spreadsheetId] : []
}

/**
 * Resolves the spreadsheet an action should operate on: the one it explicitly
 * asked for, or the installation's default.
 */
export const resolveSpreadsheetId = async ({
  ctx,
  client,
  requestedSpreadsheetId,
}: {
  ctx: bp.Context
  client: bp.Client
  requestedSpreadsheetId?: string
}): Promise<string> => {
  const requested = requestedSpreadsheetId?.trim()
  const allowed = await getAllowedSpreadsheetIds({ ctx, client })

  if (requested) {
    // A service account reaches whatever has been shared with it, so there is no
    // picked set to validate against.
    if (ctx.configurationType === 'serviceAccountKey' || allowed.includes(requested)) {
      return requested
    }

    throw new sdk.RuntimeError(
      `Spreadsheet "${requested}" is not one of the spreadsheets selected for this integration. ` +
        (allowed.length
          ? `Re-run the setup wizard and select it, or use one of: ${allowed.join(', ')}.`
          : 'Re-run the setup wizard and select it.')
    )
  }

  const defaultSpreadsheetId = allowed[0]

  if (!defaultSpreadsheetId) {
    throw new sdk.RuntimeError(
      'No spreadsheet is configured for this integration. Re-run the setup wizard and select at least one spreadsheet.'
    )
  }

  return defaultSpreadsheetId
}

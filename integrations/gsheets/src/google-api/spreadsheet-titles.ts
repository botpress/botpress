/**
 * Resolves the title of each given spreadsheet, tolerating individual failures.
 *
 * A spreadsheet that can no longer be reached (deleted, or access revoked since
 * setup) resolves to `undefined` instead of rejecting, so one dead spreadsheet
 * doesn't hide the others from a listing.
 */
export const resolveSpreadsheetTitles = async (
  spreadsheetIds: string[],
  fetchTitle: (spreadsheetId: string) => Promise<string | undefined>
): Promise<Record<string, string | undefined>> => {
  const uniqueIds = [...new Set(spreadsheetIds)]

  const entries = await Promise.all(
    uniqueIds.map(async (spreadsheetId) => {
      try {
        return [spreadsheetId, await fetchTitle(spreadsheetId)] as const
      } catch {
        return [spreadsheetId, undefined] as const
      }
    })
  )

  return Object.fromEntries(entries)
}

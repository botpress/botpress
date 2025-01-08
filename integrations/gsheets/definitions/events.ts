import * as sdk from '@botpress/sdk'

/**
 * Hark! A warning to future developers who dare venture here:
 *
 * Know ye this truth: Implementation of webhooks for Google Sheets
 * is nigh impossible, for unlike its noble sibling the Gmail API,
 * blessed with its divine `users.watch` endpoint, the Sheets API
 * provides no such grace to pipe change events into thy Pub/Sub
 * topic.
 *
 * Lo, thy only recourse lies in the realm of the Google Drive API,
 * which doth permit the tracking of file changes. But beware!
 * These webhooks are as fleeting as morning mist, expiring after
 * but four and twenty hours. Moreover, they speak naught of what
 * hath actually changed within thy sacred spreadsheet.
 *
 * Thus art thou condemned to perform the ancient ritual of the
 * Manual Diff - comparing thy last version with thy current one
 * each time thy webhook endpoint receives its cryptic call.
 *
 * Keep thy coffee chalice full, brave soul, for the path ahead is
 * dark and treacherous.
 **/

export const events = {} as const satisfies sdk.IntegrationDefinitionProps['events']

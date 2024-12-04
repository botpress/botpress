export const APP_PDF_MIMETYPE = 'application/pdf'
export const TEXT_HTML_MIMETYPE = 'text/html'
export const TEXT_MARKDOWN_MIMETYPE = 'text/markdown'
export const TEXT_PLAIN_MIMETYPE = 'text/plain'

export const APP_GOOGLE_DOCS_MIMETYPE = 'application/vnd.google-apps.document'
export const APP_GOOGLE_SHEETS_MIMETYPE = 'application/vnd.google-apps.spreadsheet'
export const APP_GOOGLE_SLIDES_MIMETYPE = 'application/vnd.google-apps.presentation'

export const APP_GOOGLE_FOLDER_MIMETYPE = 'application/vnd.google-apps.folder'
export const APP_GOOGLE_SHORTCUT_MIMETYPE = 'application/vnd.google-apps.shortcut'

// Order of types in the array should reflect the priority of type when automatically choosing type for export
// Prioritize types best suited for indexing
export const INDEXABLE_MIMETYPES = [APP_PDF_MIMETYPE, TEXT_HTML_MIMETYPE, TEXT_MARKDOWN_MIMETYPE, TEXT_PLAIN_MIMETYPE]

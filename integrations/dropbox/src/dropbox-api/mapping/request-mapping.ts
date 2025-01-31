import * as dropbox from 'dropbox'
import * as bp from '.botpress'

export type ActionInput = { [K in keyof bp.ActionProps]: bp.ActionProps[K]['input'] }

export namespace RequestMapping {
  export const mapSearchItems = (
    actionInput: ActionInput['searchItems'],
    maxResults?: number
  ): dropbox.files.SearchV2Arg => ({
    query: actionInput.query,
    options: {
      file_categories: actionInput.fileCategories?.map((cat) => ({ '.tag': cat })),
      file_extensions: actionInput.fileExtensions,
      filename_only: actionInput.fileNameOnly,
      order_by: actionInput.orderBy && { '.tag': actionInput.orderBy },
      path: actionInput.path,
      max_results: maxResults,
      file_status: { '.tag': 'active' },
    },
  })
}

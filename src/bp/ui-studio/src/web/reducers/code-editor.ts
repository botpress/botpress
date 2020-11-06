import { CustomTemplate } from 'common/controls'
import _ from 'lodash'
import { handleActions } from 'redux-actions'
import { loadInEditor, updateCode } from '~/actions'

const defaultState = {
  code: '',
  codeCallback: undefined,
  template: undefined
}

export interface CodeEditorReducer {
  code: string
  editorCallback: (code: string) => void
  template?: string | CustomTemplate
}

const reducer = handleActions(
  {
    [updateCode]: (state, { payload }) => ({
      ...state,
      code: payload
    }),
    [loadInEditor]: (state, { payload }) => {
      return { ...state, ...payload }
    }
  },
  defaultState
)

export default reducer

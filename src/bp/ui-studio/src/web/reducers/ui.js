import { handleActions } from 'redux-actions'
import _ from 'lodash'
import storage from '../util/storage'
import {
  updateDocumentationModal,
  addDocumentationHint,
  removeDocumentationHint,
  viewModeChanged,
  updateGlobalStyle,
  toggleBottomPanel
} from '~/actions'

const bottomPanelStorageKey = `bp::${window.BOT_ID}::bottom-panel-open`
const defaultBottomPanelOpen = storage.get(bottomPanelStorageKey) === 'true'

const defaultState = {
  viewMode: -1,
  customStyle: {},
  docHints: [],
  docModal: null,
  bottomPanel: defaultBottomPanelOpen || false
}

const reducer = handleActions(
  {
    [viewModeChanged]: (state, { payload }) => ({
      ...state,
      viewMode: payload.toString()
    }),
    [updateGlobalStyle]: (state, { payload }) => ({
      ...state,
      customStyle: Object.assign({}, state.customStyle, payload)
    }),
    [addDocumentationHint]: (state, { payload }) => ({
      ...state,
      docHints: _.uniq([payload, ...state.docHints])
    }),
    [removeDocumentationHint]: (state, { payload }) => ({
      ...state,
      docHints: _.without(state.docHints, payload)
    }),
    [updateDocumentationModal]: (state, { payload }) => ({
      ...state,
      docModal: payload
    }),
    [toggleBottomPanel]: (state, {}) => {
      const value = !state.bottomPanel
      localStorage.setItem(bottomPanelStorageKey, value)
      return {
        ...state,
        bottomPanel: value
      }
    }
  },
  defaultState
)

export default reducer

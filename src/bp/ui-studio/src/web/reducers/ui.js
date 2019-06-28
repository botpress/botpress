import { handleActions } from 'redux-actions'
import _ from 'lodash'

import {
  updateDocumentationModal,
  addDocumentationHint,
  removeDocumentationHint,
  viewModeChanged,
  updateGlobalStyle,
  toggleBottomPanel
} from '~/actions'

const defaultState = {
  viewMode: -1,
  customStyle: {},
  docHints: [],
  docModal: null,
  bottomPanel: true
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
    [toggleBottomPanel]: (state, {}) => ({
      ...state,
      bottomPanel: !state.bottomPanel
    })
  },
  defaultState
)

export default reducer

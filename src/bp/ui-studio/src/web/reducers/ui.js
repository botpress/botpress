import { handleActions } from 'redux-actions'
import _ from 'lodash'

import {
  updateDocumentationModal,
  addDocumentationHint,
  removeDocumentationHint,
  viewModeChanged,
  updateGlobalStyle
} from '~/actions'

const defaultState = {
  viewMode: -1,
  customStyle: {},
  docHints: [],
  docModal: null
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
    })
  },
  defaultState
)

export default reducer

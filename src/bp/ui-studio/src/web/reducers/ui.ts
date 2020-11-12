import _ from 'lodash'
import { handleActions } from 'redux-actions'
import {
  addDocumentationHint,
  removeDocumentationHint,
  setEmulatorOpen,
  toggleBottomPanel,
  toggleBottomPanelExpand,
  toggleInspector,
  updateDocumentationModal,
  updateGlobalStyle,
  viewModeChanged,
  zoomIn,
  zoomOut,
  zoomToLevel
} from '~/actions'

import storage from '../util/storage'

export interface UiReducer {
  viewMode: any
  docHints: string[]
  emulatorOpen: boolean
  zoomLevel: number
  bottomPanel: boolean
  bottomPanelExpanded: boolean
  inspectorEnabled: boolean
  setEmulatorOpen: (newState: boolean) => void
}

const bottomPanelStorageKey = `bp::${window.BOT_ID}::bottom-panel-open`
const inspectorEnabledStorageKey = `bp::${window.BOT_ID}::enable-inspector`
const defaultBottomPanelOpen = storage.get(bottomPanelStorageKey) === 'true'
const defaultInspectorEnabled = storage.get(inspectorEnabledStorageKey) === 'true'

const defaultState = {
  viewMode: -1,
  customStyle: {},
  docHints: [],
  docModal: null,
  bottomPanel: defaultBottomPanelOpen || false,
  bottomPanelExpanded: false,
  inspectorEnabled: defaultInspectorEnabled,
  emulatorOpen: false,
  zoomLevel: 100
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
    [toggleBottomPanelExpand]: state => ({
      ...state,
      bottomPanelExpanded: !state.bottomPanelExpanded
    }),
    [toggleBottomPanel]: (state, {}) => {
      const value = !state.bottomPanel
      localStorage.setItem(bottomPanelStorageKey, value.toString())
      return {
        ...state,
        bottomPanel: value
      }
    },
    [toggleInspector]: (state, {}) => {
      const value = !state.inspectorEnabled
      localStorage.setItem(inspectorEnabledStorageKey, value.toString())
      return {
        ...state,
        inspectorEnabled: value
      }
    },
    [zoomIn]: (state, {}) => {
      return {
        ...state,
        zoomLevel: state.zoomLevel + 25
      }
    },
    [zoomToLevel]: (state, { payload }) => {
      return {
        ...state,
        zoomLevel: payload
      }
    },
    [zoomOut]: (state, {}) => {
      const newLevel = state.zoomLevel - 25
      return {
        ...state,
        zoomLevel: newLevel > 10 ? newLevel : 10
      }
    },
    [setEmulatorOpen]: (state, { payload }) => ({
      ...state,
      emulatorOpen: payload
    })
  },
  defaultState
)

export default reducer

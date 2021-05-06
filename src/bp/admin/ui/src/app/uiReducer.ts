import { AppThunk } from '~/app/rootReducer'

const TOGGLE_BOTTOM_PANEL = 'ui/TOGGLE_BOTTOM_PANEL'
const TOGGLE_BOTTOM_PANEL_EXPAND = 'ui/TOGGLE_BOTTOM_PANEL_EXPAND'
const UPDATE_PAGE_HEADER = 'ui/UPDATE_PAGE_HEADER'
const SET_CONTENT_LANG = 'ui/SET_CONTENT_LANG'

interface UiState {
  bottomPanel: boolean
  bottomPanelExpanded: boolean
  pageTitle?: JSX.Element | string
  pageHelpText?: JSX.Element | string
  contentLang?: string
}

const bottomPanelStorageKey = 'bp:bottom-panel-open'
const defaultBottomPanelOpen = localStorage.getItem(bottomPanelStorageKey) === 'true'

const initialState: UiState = {
  bottomPanel: defaultBottomPanelOpen,
  bottomPanelExpanded: false,
  pageTitle: undefined,
  pageHelpText: undefined,
  contentLang: 'en'
}

export default (state = initialState, action): UiState => {
  switch (action.type) {
    case TOGGLE_BOTTOM_PANEL:
      const value = !state.bottomPanel
      localStorage.setItem(bottomPanelStorageKey, value.toString())
      return {
        ...state,
        bottomPanel: value
      }

    case UPDATE_PAGE_HEADER:
      return {
        ...state,
        ...action.payload
      }

    case TOGGLE_BOTTOM_PANEL_EXPAND:
      return {
        ...state,
        bottomPanelExpanded: !state.bottomPanelExpanded
      }

    case SET_CONTENT_LANG:
      return {
        ...state,
        contentLang: action.contentLang
      }

    default:
      return state
  }
}

export const toggleBottomPanel = (): AppThunk => {
  return async dispatch => {
    dispatch({ type: TOGGLE_BOTTOM_PANEL })
  }
}

export const toggleBottomPanelExpand = (): AppThunk => {
  return async dispatch => {
    dispatch({ type: TOGGLE_BOTTOM_PANEL_EXPAND })
  }
}

export const updatePageHeader = (pageTitle?: JSX.Element | string, pageHelpText?: JSX.Element | string): AppThunk => {
  return async dispatch => {
    dispatch({ type: UPDATE_PAGE_HEADER, payload: { pageTitle, pageHelpText } })
  }
}

export const setContentLang = (contentLang: string): AppThunk => {
  return async dispatch => {
    dispatch({ type: SET_CONTENT_LANG, contentLang })
  }
}

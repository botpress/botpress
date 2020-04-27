import { LibraryElement } from 'common/typings'
import _ from 'lodash'
import { handleActions } from 'redux-actions'
import {
  receiveContentCategories,
  receiveContentItem,
  receiveContentItems,
  receiveContentItemsCount,
  receiveLibrary,
  receiveQNAContentElement
} from '~/actions'
const defaultState = {
  categories: null,
  currentItems: [],
  itemsById: {},
  itemsCount: 0
}

export default handleActions(
  {
    [receiveContentCategories]: (state, { payload }) => ({
      ...state,
      categories: payload
    }),

    [receiveContentItems]: (state, { payload }) => ({
      ...state,
      currentItems: payload
    }),

    [receiveContentItem]: (state, { payload }) => ({
      ...state,
      itemsById: {
        ...state.itemsById,
        [payload.id]: payload
      }
    }),

    [receiveContentItemsCount]: (state, { payload }) => ({
      ...state,
      itemsCount: payload.data.count
    }),

    [receiveQNAContentElement]: (state, { payload }) => ({
      ...state,
      qnaUsage: payload
    }),

    [receiveLibrary]: (state, { payload }) => ({
      ...state,
      library: payload
    })
  },
  defaultState
)

export interface ContentReducer {
  categories: any
  currentItems: any
  qnaUsage: any
  library: LibraryElement[]
}

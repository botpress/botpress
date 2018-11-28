import { handleActions } from 'redux-actions'
import _ from 'lodash'

import {
  receiveContentCategories,
  receiveContentItems,
  receiveContentItem,
  receiveContentItemsCount,
  receiveContentSchema
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
    })
  },
  defaultState
)

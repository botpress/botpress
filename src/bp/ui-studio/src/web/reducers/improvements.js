import { handleActions } from 'redux-actions'

import { allImprovementsReceived } from '~/actions'

const defaultState = []

const reducer = handleActions({ [allImprovementsReceived]: (state, { payload }) => [...payload] }, defaultState)

export default reducer

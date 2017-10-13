import { combineReducers } from 'redux'
import _ from 'lodash'

import flows from './flows'

const bpApp = combineReducers({ flows })

export default bpApp

export const getCurrentFlow = state => state.flows[state.currentFlow]

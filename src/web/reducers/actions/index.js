// TODO --> We put the actions here because we already have NuclearJS actions defined in ~/actions.
// Move this folder to ~/actions once we removed NuclearJS completely

import { createAction } from 'redux-actions'
import axios from 'axios'

export const requestFlows = createAction('FLOWS/REQUEST')
export const receiveFlows = createAction('FLOWS/RECEIVE', flows => flows, () => ({ receiveAt: new Date() }))

export const fetchFlows = () => dispatch => {
  dispatch(requestFlows())

  axios.get('https://google.com').then(({ data }) => {
    console.log('Receive flows')
    dispatch(
      receiveFlows([
        {
          id: 1234
        }
      ])
    )
  })
}

// export const fetchFlowsDefinitions = createAction('FLOWS_DEFINITIONS_FETCH')

export const saveFlow = createAction('FLOWS/FLOW/SAVE')
export const updateFlow = createAction('FLOWS/FLOW/UPDATE')
export const switchFlow = createAction('FLOWS/FLOW/SWITCH')
export const updateFlowNode = createAction('FLOWS/FLOW/UPDATE_NODE')
export const switchFlowNode = createAction('FLOWS/FLOW/SWITCH_NODE')

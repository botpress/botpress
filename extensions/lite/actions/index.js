import { createAction } from 'redux-actions'

export const rulesReceived = createAction('RULES/RECEIVED')
export const fetchRules = () => dispatch => {
  dispatch(rulesReceived([]))
}

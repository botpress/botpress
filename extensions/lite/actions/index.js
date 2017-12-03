import { rulesReceived } from '~/actions'

export const fetchRules = () => dispatch => {
  dispatch(rulesReceived([]))
}

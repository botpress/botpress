import { Incident } from 'botpress/sdk'
import api from '~/api'

const FETCH_INCIDENTS_REQUESTED = 'bots/FETCH_INCIDENTS_REQUESTED'
const FETCH_INCIDENTS_RECEIVED = 'bots/FETCH_INCIDENTS_RECEIVED'

export interface AlertingState {
  lastDate?: Date
  loading: boolean
  incidents: Incident[]
}

const initialState: AlertingState = {
  lastDate: undefined,
  loading: true,
  incidents: []
}

export default (state = initialState, action) => {
  switch (action.type) {
    case FETCH_INCIDENTS_RECEIVED:
      return {
        ...state,
        incidents: action.data,
        loading: false
      }

    case FETCH_INCIDENTS_REQUESTED:
      return {
        ...state,
        loading: true
      }

    default:
      return state
  }
}

export const fetchIncidents = (fromTime, toTime) => {
  return async dispatch => {
    dispatch({
      type: FETCH_INCIDENTS_REQUESTED
    })

    const { data } = await api.getSecured().post('/admin/health/alerting/incidents', {
      fromTime,
      toTime
    })

    dispatch({
      type: FETCH_INCIDENTS_RECEIVED,
      data
    })
  }
}

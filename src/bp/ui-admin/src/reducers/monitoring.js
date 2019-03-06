import api from '../api'
import moment from 'moment'

export const FETCH_STATS_FULL_REQUESTED = 'monitoring/FETCH_STATS_FULL_REQUESTED'
export const FETCH_STATS_FULL_RECEIVED = 'monitoring/FETCH_STATS_FULL_RECEIVED'
export const FETCH_STATS_PARTIAL_RECEIVED = 'bots/FETCH_STATS_PARTIAL_RECEIVED'
export const FETCH_INCIDENTS_REQUESTED = 'bots/FETCH_INCIDENTS_REQUESTED'
export const FETCH_INCIDENTS_RECEIVED = 'bots/FETCH_INCIDENTS_RECEIVED'

const initialState = {
  stats: null,
  lastDate: null,
  loading: true,
  loadingIncidents: true
}

export default (state = initialState, action) => {
  switch (action.type) {
    case FETCH_STATS_FULL_RECEIVED:
      return {
        ...state,
        stats: action.stats,
        lastDate: action.toTime,
        loading: false
      }

    case FETCH_STATS_PARTIAL_RECEIVED:
      return {
        ...state,
        stats: [...state.stats, ...action.stats],
        lastDate: action.toTime
      }

    case FETCH_STATS_FULL_REQUESTED:
      return {
        ...state,
        loading: true
      }

    case FETCH_INCIDENTS_RECEIVED:
      return {
        ...state,
        incidents: action.data,
        loadingIncidents: false
      }

    case FETCH_INCIDENTS_REQUESTED:
      return {
        ...state,
        loadingIncidents: true
      }

    default:
      return state
  }
}

export const fetchStats = (fromTime, toTime) => {
  return async dispatch => {
    dispatch({
      type: FETCH_STATS_FULL_REQUESTED
    })

    const { data } = await api.getSecured().post(`/admin/server/monitoring`, {
      fromTime,
      toTime
    })

    dispatch({
      type: FETCH_STATS_FULL_RECEIVED,
      stats: data && data.map(JSON.parse),
      toTime
    })
  }
}

export const fetchIncidents = (fromTime, toTime) => {
  return async dispatch => {
    dispatch({
      type: FETCH_INCIDENTS_REQUESTED
    })

    const { data } = await api.getSecured().post(`/admin/server/incidents`, {
      fromTime,
      toTime
    })

    dispatch({
      type: FETCH_INCIDENTS_RECEIVED,
      data
    })
  }
}

export const refreshStats = () => {
  return async (dispatch, getState) => {
    const { monitoring: state } = getState()

    const toTime = moment()
      .toDate()
      .getTime()

    const { data } = await api.getSecured().post(`/admin/server/monitoring`, {
      fromTime: state.lastDate,
      toTime
    })

    dispatch({
      type: FETCH_STATS_PARTIAL_RECEIVED,
      stats: data && data.map(JSON.parse),
      toTime
    })
  }
}

import { MonitoringStats } from 'common/monitoring'
import moment from 'moment'

import api from '~/app/api'
import { AppThunk } from '~/app/rootReducer'

const FETCH_STATS_FULL_REQUESTED = 'monitoring/FETCH_STATS_FULL_REQUESTED'
const FETCH_STATS_FULL_RECEIVED = 'monitoring/FETCH_STATS_FULL_RECEIVED'
const FETCH_STATS_PARTIAL_RECEIVED = 'bots/FETCH_STATS_PARTIAL_RECEIVED'

interface MonitoringState {
  stats?: MonitoringStats[]
  lastDate?: Date
  loading: boolean
}

const initialState: MonitoringState = {
  stats: undefined,
  lastDate: undefined,
  loading: true
}

export default (state = initialState, action): MonitoringState => {
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
        stats: [...(state.stats || []), ...action.stats],
        lastDate: action.toTime
      }

    case FETCH_STATS_FULL_REQUESTED:
      return {
        ...state,
        loading: true
      }

    default:
      return state
  }
}

const parseStats = data => data?.map(JSON.parse).map(x => ({ ...x, uniqueId: `${x.host}/${x.serverId}` }))

export const fetchStats = (fromTime, toTime): AppThunk => {
  return async dispatch => {
    dispatch({ type: FETCH_STATS_FULL_REQUESTED })

    const { data } = await api.getSecured().post('/admin/health/monitoring', {
      fromTime,
      toTime
    })

    dispatch({
      type: FETCH_STATS_FULL_RECEIVED,
      stats: parseStats(data),
      toTime
    })
  }
}

export const refreshStats = (): AppThunk => {
  return async (dispatch, getState) => {
    const { monitoring: state } = getState()

    const toTime = moment()
      .toDate()
      .getTime()

    const { data } = await api.getSecured().post('/admin/health/monitoring', {
      fromTime: state.lastDate,
      toTime
    })

    dispatch({
      type: FETCH_STATS_PARTIAL_RECEIVED,
      stats: parseStats(data),
      toTime
    })
  }
}

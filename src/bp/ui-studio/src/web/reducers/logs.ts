import takeRight from 'lodash/takeRight'
import { handleActions } from 'redux-actions'
import { appendLog, setLogs } from '~/actions'
import { LOGS_LIMIT } from '~/components/Layout/StatusBar/BottomPanel'

const defaultState: LogsReducer = {
  logs: []
}

const reducer = handleActions(
  {
    [appendLog]: (state, { payload }) => ({ ...state, logs: [...takeRight(state.logs, LOGS_LIMIT), payload] }),
    [setLogs]: (state, { payload }) => ({ ...state, logs: payload })
  },
  defaultState
)

export default reducer

export interface LogsReducer {
  logs: LogEntry[]
}

export interface LogEntry {
  id: string
  level: string
  message: string
  args: any
  ts: Date
}

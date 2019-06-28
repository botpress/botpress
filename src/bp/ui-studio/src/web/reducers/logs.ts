import { handleActions } from 'redux-actions'
import { appendLog } from '~/actions'

const defaultState: LogsReducer = {
  logs: []
}

const reducer = handleActions(
  {
    [appendLog]: (state, { payload }) => ({ ...state, logs: [...state.logs, payload] })
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

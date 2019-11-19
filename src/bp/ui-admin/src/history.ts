import { createBrowserHistory, History, Location } from 'history'
import qs from 'query-string'

const addLocationQuery = history => {
  history.location = Object.assign(history.location, {
    query: qs.parse(history.location.search)
  })
}

export type ExtendedHistory = History & {
  location: Location & { query: any }
}

const history: ExtendedHistory = createBrowserHistory({ basename: `${window['ROOT_PATH']}/admin` }) as ExtendedHistory

addLocationQuery(history)
history.listen(() => addLocationQuery(history))

export default history

import qs from 'query-string'
import createHistory from 'history/createBrowserHistory'

const addLocationQuery = history => {
  history.location = Object.assign(history.location, {
    query: qs.parse(history.location.search)
  })
}

const history = createHistory({ basename: `${window.ROOT_PATH}admin` })

addLocationQuery(history)
history.listen(() => addLocationQuery(history))

export default history

import 'babel-polyfill'
import React from 'expose-loader?React!react'
import ReactDOM from 'expose-loader?ReactDOM!react-dom'
import { connect } from 'react-redux'
import { Provider } from 'react-redux'
import queryString from 'query-string'
import axios from 'axios'
import { parseBotId } from './util'

import store from './store'
import { fetchModules } from './actions'
import InjectedModuleView from '~/components/PluginInjectionSite/module'
import { moduleViewNames } from '~/util/Modules'
import { getToken, getUniqueVisitorId } from '~/util/Auth'

const token = getToken()
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token.token}`
}

const { m, v, ref } = queryString.parse(location.search)

const alternateModuleNames = {
  'platform-webchat': 'channel-web'
}
const moduleName = alternateModuleNames[m] || m

class LiteView extends React.Component {
  componentDidMount() {
    this.props.fetchModules()
    this.sendQueries()
  }

  sendQueries() {
    if (!ref) {
      return
    }

    const userId = window.__BP_VISITOR_ID || getUniqueVisitorId()

    // TODO: why don't we have module-specific code inside of that module?
    axios.get(`/api/botpress-platform-webchat/${userId}/reference?ref=${ref}`)
  }

  render() {
    const modules = moduleViewNames(this.props.modules, 'plugin')
    const onNotFound = () => (
      <h1>
        Module ${moduleName} with view ${v} not found
      </h1>
    )

    return (
      <div>
        <InjectedModuleView moduleName={moduleName} lite={true} componentName={v} onNotFound={onNotFound} />
        {modules.map(({ moduleName, componentName }, i) => (
          <InjectedModuleView
            key={i}
            moduleName={moduleName}
            lite={true}
            componentName={componentName}
            onNotFound={onNotFound}
          />
        ))}
      </div>
    )
  }
}

const mapDispatchToProps = { fetchModules }
const mapStateToProps = state => ({ modules: state.modules })
const LiteViewConnected = connect(
  mapStateToProps,
  mapDispatchToProps
)(LiteView)

ReactDOM.render(
  <Provider store={store}>
    <LiteViewConnected />
  </Provider>,
  document.getElementById('app')
)

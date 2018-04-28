import 'babel-polyfill'
import React from 'expose-loader?React!react'
import ReactDOM from 'expose-loader?ReactDOM!react-dom'
import PropTypes from 'expose-loader?PropTypes!prop-types'
import ReactBootstrap from 'expose-loader?ReactBootstrap!react-bootstrap'
import { connect } from 'react-redux'
import { Provider } from 'react-redux'
import queryString from 'query-string'
import axios from 'axios'

import store from './store'
import { fetchModules } from './actions'
import InjectedModuleView from '~/components/PluginInjectionSite/module'
import { moduleViewNames } from '~/util/Modules'
import { getToken } from '~/util/Auth'

const token = getToken()
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token.token}`
}

const { m, v } = queryString.parse(location.search)
const alternateModuleNames = {
  'platform-webchat': 'channel-web'
}
const moduleName = alternateModuleNames[m] || m

class LiteView extends React.Component {
  componentDidMount() {
    this.props.fetchModules()
  }

  render() {
    const modules = moduleViewNames(this.props.modules.filter(module => module.isPlugin))
    const onNotFound = () => (
      <h1>
        Module ${moduleName} with view ${v} not found
      </h1>
    )

    return (
      <div>
        <InjectedModuleView moduleName={moduleName} viewName={v} lite={true} onNotFound={onNotFound} />
        {modules.map(({ moduleName, viewName }, i) => (
          <InjectedModuleView key={i} moduleName={moduleName} viewName={viewName} onNotFound={onNotFound} />
        ))}
      </div>
    )
  }
}

const mapDispatchToProps = { fetchModules }
const mapStateToProps = state => ({ modules: state.modules })
const LiteViewConnected = connect(mapStateToProps, mapDispatchToProps)(LiteView)

ReactDOM.render(
  <Provider store={store}>
    <LiteViewConnected />
  </Provider>,
  document.getElementById('app')
)

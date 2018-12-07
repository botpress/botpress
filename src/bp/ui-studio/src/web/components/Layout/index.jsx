import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import classnames from 'classnames'
import { ToastContainer } from 'react-toastify'
import { Route, Switch, Redirect } from 'react-router-dom'

import Header from './Header'
import Sidebar from './Sidebar'

import SelectContentManager from '~/components/Content/Select/Manager'
import Content from '~/views/Content'
import GhostContent from '~/views/GhostContent'
import FlowBuilder from '~/views/FlowBuilder'
import Module from '~/views/Module'
import Notifications from '~/views/Notifications'
import Logs from '~/views/Logs'
import BackendToast from '~/components/Util/BackendToast'

import PluginInjectionSite from '~/components/PluginInjectionSite'

import { viewModeChanged } from '~/actions'

import layout from './Layout.styl'
import style from './style.scss'
import StatusBar from './StatusBar'

class Layout extends React.Component {
  state = {
    statusBarEvent: undefined
  }

  componentDidMount() {
    this.botpressVersion = window.BOTPRESS_VERSION
    this.botName = window.BOT_ID

    const viewMode = this.props.location.query && this.props.location.query.viewMode

    setImmediate(() => {
      this.props.viewModeChanged(viewMode || 0)
    })
  }

  handleModuleEvent = event => {
    this.setState({ statusBarEvent: event })
  }

  render() {
    if (this.props.viewMode < 0) {
      return null
    }

    const hasHeader = this.props.viewMode <= 2
    const classNames = classnames({
      [style.container]: hasHeader,
      'bp-container': hasHeader
    })

    return (
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main className={layout.main}>
          <Header />
          <Switch>
            <Route exact path="/" render={() => <Redirect to="/flows" />} />
            <Route exact path="/content" component={Content} />
            <Route exact path="/version-control" component={GhostContent} />
            <Route exact path="/flows/:flow*" component={FlowBuilder} />
            <Route
              exact
              path="/modules/:moduleName/:subView?"
              render={props => <Module {...props} onModuleEvent={this.handleModuleEvent} />}
            />
            <Route exact path="/notifications" component={Notifications} />
            <Route exact path="/logs" component={Logs} />
          </Switch>
        </main>
        <ToastContainer position="bottom-right" />
        <PluginInjectionSite site="overlay" />
        <BackendToast />
        <SelectContentManager />
        <StatusBar
          botName={this.botName}
          botpressVersion={this.botpressVersion}
          statusBarEvent={this.state.statusBarEvent}
        />
      </div>
    )
  }
}

const mapStateToProps = state => ({
  license: state.license,
  viewMode: state.ui.viewMode
})

const mapDispatchToProps = dispatch => bindActionCreators({ viewModeChanged }, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Layout)

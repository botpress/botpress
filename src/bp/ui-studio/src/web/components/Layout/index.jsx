import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { HotKeys } from 'react-hotkeys'

import classnames from 'classnames'
import { ToastContainer } from 'react-toastify'
import { Route, Switch, Redirect } from 'react-router-dom'

import Header from './Header'
import Sidebar from './Sidebar'

import Dock from '~/components/ChatEmulator/Dock'
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
import EventEmitter2 from 'eventemitter2'

class Layout extends React.Component {
  statusBarEmitter = new EventEmitter2({ wildcard: true })

  state = {
    emulatorOpen: false
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
    this.statusBarEmitter.emit('module', event)
  }

  toggleEmulator = () => this.setState({ emulatorOpen: !this.state.emulatorOpen })

  render() {
    if (this.props.viewMode < 0) {
      return null
    }

    const hasHeader = this.props.viewMode <= 2
    const classNames = classnames({
      [style.container]: hasHeader,
      'bp-container': hasHeader
    })

    const keyHandlers = {
      'emulator-toggle': this.toggleEmulator
    }

    return (
      <HotKeys handlers={keyHandlers} focused>
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
          <Dock isOpen={this.state.emulatorOpen} onToggle={this.toggleEmulator} />
          <StatusBar
            botName={this.botName}
            onToggleEmulator={this.toggleEmulator}
            isEmulatorOpen={this.state.emulatorOpen}
            botpressVersion={this.botpressVersion}
            emitter={this.statusBarEmitter}
          />
        </div>
      </HotKeys>
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

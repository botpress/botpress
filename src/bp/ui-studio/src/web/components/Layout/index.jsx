import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { HotKeys } from 'react-hotkeys'

import { ToastContainer } from 'react-toastify'
import { Route, Switch, Redirect } from 'react-router-dom'

import Header from './Header'
import Sidebar from './Sidebar'

import Dock from '~/components/ChatEmulator/Dock'
import DocumentationModal from '~/components/Layout/DocumentationModal'
import SelectContentManager from '~/components/Content/Select/Manager'
import Content from '~/views/Content'
import FlowBuilder from '~/views/FlowBuilder'
import Module from '~/views/Module'
import Notifications from '~/views/Notifications'
import Logs from '~/views/Logs'
import BackendToast from '~/components/Util/BackendToast'

import PluginInjectionSite from '~/components/PluginInjectionSite'

import { viewModeChanged, updateDocumentationModal } from '~/actions'
import { isInputFocused } from '~/keyboardShortcuts'

import layout from './Layout.styl'
import StatusBar from './StatusBar'

class Layout extends React.Component {
  state = {
    emulatorOpen: false,
    langSwitcherOpen: false
  }

  componentDidMount() {
    this.botpressVersion = window.BOTPRESS_VERSION
    this.botName = window.BOT_NAME
    this.botId = window.BOT_ID

    const viewMode = this.props.location.query && this.props.location.query.viewMode

    setImmediate(() => {
      this.props.viewModeChanged(viewMode || 0)
    })
  }

  toggleEmulator = () => this.setState({ emulatorOpen: !this.state.emulatorOpen })

  focusEmulator = e => {
    if (!isInputFocused()) {
      e.preventDefault()

      this.setState({ emulatorOpen: false }, () => {
        this.setState({ emulatorOpen: true })
      })
    }
  }

  toggleDocs = () => {
    if (this.props.docModal) {
      this.props.updateDocumentationModal(null)
    } else if (this.props.docHints.length) {
      this.props.updateDocumentationModal(this.props.docHints[0])
    }
  }

  toggleLangSwitcher = () => {
    if (!isInputFocused()) {
      const langSwitcherOpen = !this.state.langSwitcherOpen
      this.setState({ langSwitcherOpen }, () => {
        //lang switcher just closed
        if (!langSwitcherOpen) {
          this.focusMain()
        }
      })
    }
  }

  focusMain = () => {
    if (this.mainEl) {
      this.mainEl.focus()
    }
  }

  render() {
    if (this.props.viewMode < 0) {
      return null
    }

    const keyHandlers = {
      'emulator-focus': this.focusEmulator,
      'docs-toggle': this.toggleDocs,
      'lang-switcher': this.toggleLangSwitcher
    }

    return (
      <HotKeys handlers={keyHandlers}>
        <DocumentationModal />
        <div style={{ display: 'flex' }}>
          <Sidebar />
          <main ref={el => (this.mainEl = el)} className={layout.main} id="main" tabIndex={9999}>
            <Header />
            <Switch>
              <Route exact path="/" render={() => <Redirect to="/flows" />} />
              <Route exact path="/content" component={Content} />
              <Route exact path="/flows/:flow*" component={FlowBuilder} />
              <Route exact path="/modules/:moduleName/:componentName?" render={props => <Module {...props} />} />
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
            botName={this.botName || this.botId}
            onToggleEmulator={this.toggleEmulator}
            isEmulatorOpen={this.state.emulatorOpen}
            botpressVersion={this.botpressVersion}
            emitter={this.statusBarEmitter}
            langSwitcherOpen={this.state.langSwitcherOpen}
            toggleLangSwitcher={this.toggleLangSwitcher}
          />
        </div>
      </HotKeys>
    )
  }
}

const mapStateToProps = state => ({
  viewMode: state.ui.viewMode,
  docHints: state.ui.docHints
})

const mapDispatchToProps = dispatch => bindActionCreators({ viewModeChanged, updateDocumentationModal }, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Layout)

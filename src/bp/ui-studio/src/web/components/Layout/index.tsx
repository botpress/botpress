import React from 'react'
import { HotKeys } from 'react-hotkeys'
import { connect } from 'react-redux'
import { Redirect, Route, Switch } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { bindActionCreators } from 'redux'
import { updateDocumentationModal, viewModeChanged } from '~/actions'
import SelectContentManager from '~/components/Content/Select/Manager'
import DocumentationModal from '~/components/Layout/DocumentationModal'
import PluginInjectionSite from '~/components/PluginInjectionSite'
import BackendToast from '~/components/Util/BackendToast'
import { isInputFocused } from '~/keyboardShortcuts'
import Content from '~/views/Content'
import FlowBuilder from '~/views/FlowBuilder'
import Logs from '~/views/Logs'
import Module from '~/views/Module'
import Notifications from '~/views/Notifications'

import GuidedTour from './GuidedTour'
import layout from './Layout.styl'
import Sidebar from './Sidebar'
import StatusBar from './StatusBar'

interface ILayoutProps {
  viewModeChanged: any
  viewMode: number
  docModal: any
  docHints: any
  updateDocumentationModal: any
  location: any
  history: any
}

class Layout extends React.Component<ILayoutProps> {
  private botpressVersion: string
  private botName: string
  private botId: string
  private mainEl: HTMLElement
  private statusBarEmitter: any

  state = {
    emulatorOpen: false,
    langSwitcherOpen: false,
    guidedTourOpen: false
  }

  componentDidMount() {
    this.botpressVersion = window.BOTPRESS_VERSION
    this.botName = window.BOT_NAME
    this.botId = window.BOT_ID

    const viewMode = this.props.location.query && this.props.location.query.viewMode

    setImmediate(() => {
      this.props.viewModeChanged(Number(viewMode) || 0)
    })
  }

  toggleEmulator = () => {
    window.botpressWebChat.sendEvent({ type: 'toggle' })
  }

  toggleGuidedTour = () => {
    this.setState({ guidedTourOpen: !this.state.guidedTourOpen })
  }

  focusEmulator = e => {
    if (!isInputFocused()) {
      e.preventDefault()
      window.botpressWebChat.sendEvent({ type: 'show' })
    }
  }

  closeEmulator = e => {
    window.botpressWebChat.sendEvent({ type: 'hide' })
  }

  toggleDocs = e => {
    e.preventDefault()
    if (this.props.docModal) {
      this.props.updateDocumentationModal(null)
    } else if (this.props.docHints.length) {
      this.props.updateDocumentationModal(this.props.docHints[0])
    }
  }

  toggleLangSwitcher = e => {
    e.preventDefault()
    if (!isInputFocused()) {
      const langSwitcherOpen = !this.state.langSwitcherOpen
      this.setState({ langSwitcherOpen }, () => {
        // lang switcher just closed
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

  gotoUrl = url => {
    if (!isInputFocused()) {
      this.props.history.push(url)
      this.focusMain()
    }
  }

  render() {
    if (this.props.viewMode < 0) {
      return null
    }

    const keyHandlers = {
      'emulator-focus': this.focusEmulator,
      cancel: this.closeEmulator,
      'docs-toggle': this.toggleDocs,
      'lang-switcher': this.toggleLangSwitcher,
      'go-flow': () => this.gotoUrl('/flows'),
      'go-home': () => (window.location.href = '/admin'),
      'go-content': () => this.gotoUrl('/content'),
      'go-module-code': () => this.gotoUrl('/modules/code-editor'),
      'go-module-qna': () => this.gotoUrl('/modules/qna'),
      'go-module-testing': () => this.gotoUrl('/modules/testing'),
      'go-module-analytics': () => this.gotoUrl('/modules/analytics'),
      'go-module-nlu-intent': () => this.gotoUrl('/modules/nlu/Intents'),
      'go-module-nlu-entities': () => this.gotoUrl('/modules/nlu/Entities')
    }

    return (
      <HotKeys handlers={keyHandlers} id="mainLayout">
        <DocumentationModal />
        <div style={{ display: 'flex' }}>
          <Sidebar />
          <main ref={el => (this.mainEl = el)} className={layout.main} id="main" tabIndex={9999}>
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
          <StatusBar
            botName={this.botName || this.botId}
            onToggleEmulator={this.toggleEmulator}
            botpressVersion={this.botpressVersion}
            emitter={this.statusBarEmitter}
            langSwitcherOpen={this.state.langSwitcherOpen}
            toggleLangSwitcher={this.toggleLangSwitcher}
            onToggleGuidedTour={this.toggleGuidedTour}
          />
          <GuidedTour isDisplayed={this.state.guidedTourOpen} onToggle={this.toggleGuidedTour} />
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

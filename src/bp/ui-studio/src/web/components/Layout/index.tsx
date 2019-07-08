import React from 'react'
import { HotKeys } from 'react-hotkeys'
import { connect } from 'react-redux'
import { Redirect, Route, Switch } from 'react-router-dom'
import SplitPane from 'react-split-pane'
import { style, ToastContainer } from 'react-toastify'
import { bindActionCreators } from 'redux'
import { toggleBottomPanel, updateDocumentationModal, viewModeChanged } from '~/actions'
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
import BottomPanel from './StatusBar/BottomPanel'

interface ILayoutProps {
  viewModeChanged: any
  viewMode: number
  docModal: any
  docHints: any
  updateDocumentationModal: any
  location: any
  toggleBottomPanel: () => null
  history: any
  bottomPanel: boolean
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
    if (!isInputFocused() || e.ctrlKey) {
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
    e && e.preventDefault()
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

  toggleBottomPanel = e => {
    e.preventDefault()
    this.props.toggleBottomPanel()
  }

  goHome = () => {
    if (!isInputFocused()) {
      window.location.href = '/admin'
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
      'bottom-bar': this.toggleBottomPanel,
      'lang-switcher': this.toggleLangSwitcher,
      'go-flow': () => this.gotoUrl('/flows'),
      'go-home': this.goHome,
      'go-content': () => this.gotoUrl('/content'),
      'go-module-code': () => this.gotoUrl('/modules/code-editor'),
      'go-module-qna': () => this.gotoUrl('/modules/qna'),
      'go-module-testing': () => this.gotoUrl('/modules/testing'),
      'go-module-analytics': () => this.gotoUrl('/modules/analytics'),
      'go-understanding': () => this.gotoUrl('/modules/nlu')
    }

    const splitPanelLastSizeKey = `bp::${window.BOT_ID}::bottom-panel-size`
    const lastSize = parseInt(localStorage.getItem(splitPanelLastSizeKey) || '175', 10)
    const bottomBarSize = this.props.bottomPanel ? lastSize : 0

    return (
      <HotKeys handlers={keyHandlers} id="mainLayout">
        <DocumentationModal />
        <div style={{ display: 'flex' }} className={layout.container}>
          <Sidebar />
          <SplitPane
            split={'horizontal'}
            defaultSize={lastSize}
            onChange={size => localStorage.setItem(splitPanelLastSizeKey, size.toString())}
            size={bottomBarSize}
            primary="second"
          >
            <div>
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
            </div>
            <BottomPanel />
          </SplitPane>

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
            toggleBottomPanel={this.props.toggleBottomPanel}
          />
          <GuidedTour isDisplayed={this.state.guidedTourOpen} onToggle={this.toggleGuidedTour} />
        </div>
      </HotKeys>
    )
  }
}

const mapStateToProps = state => ({
  viewMode: state.ui.viewMode,
  docHints: state.ui.docHints,
  bottomPanel: state.ui.bottomPanel
})

const mapDispatchToProps = dispatch =>
  bindActionCreators({ viewModeChanged, updateDocumentationModal, toggleBottomPanel }, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Layout)

import { lang, utils } from 'botpress/shared'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'
import { HotKeys } from 'react-hotkeys'
import { connect } from 'react-redux'
import { Redirect, Route, Switch } from 'react-router-dom'
import SplitPane from 'react-split-pane'
import { bindActionCreators } from 'redux'
import { toggleBottomPanel, viewModeChanged } from '~/actions'
import SelectContentManager from '~/components/Content/Select/Manager'
import PluginInjectionSite from '~/components/PluginInjectionSite'
import BackendToast from '~/components/Util/BackendToast'
import Config from '~/views/Config'
import Content from '~/views/Content'
import FlowBuilder from '~/views/FlowBuilder'
import Logs from '~/views/Logs'
import Module from '~/views/Module'
import OneFlow from '~/views/OneFlow'

import BotUmountedWarning from './BotUnmountedWarning'
import CommandPalette from './CommandPalette'
import GuidedTour from './GuidedTour'
import LanguageServerHealth from './LangServerHealthWarning'
import layout from './Layout.scss'
import Sidebar from './Sidebar'
import StatusBar from './StatusBar'
import Toolbar from './Toolbar'
import BottomPanel from './Toolbar/BottomPanel'

const { isInputFocused } = utils

interface ILayoutProps {
  viewModeChanged: any
  viewMode: number
  docModal: any
  docHints: any
  location: any
  toggleBottomPanel: () => null
  history: any
  bottomPanel: boolean
  translations: any
}

const Layout: FC<ILayoutProps> = props => {
  const mainElRef = useRef(null)
  const [langSwitcherOpen, setLangSwitcherOpen] = useState(false)
  const [guidedTourOpen, setGuidedTourOpen] = useState(false)

  useEffect(() => {
    const viewMode = props.location.query && props.location.query.viewMode

    setImmediate(() => {
      props.viewModeChanged(Number(viewMode) || 0)
    })

    setTimeout(() => BotUmountedWarning(), 500)
  }, [])

  useEffect(() => {
    if (props.translations) {
      lang.extend(props.translations)
      lang.init()
    }
  }, [props.translations])

  const toggleEmulator = () => {
    window.botpressWebChat.sendEvent({ type: 'toggle' })
  }

  const toggleGuidedTour = () => {
    setGuidedTourOpen(!guidedTourOpen)
  }

  const focusEmulator = e => {
    if (!isInputFocused() || e.ctrlKey) {
      e.preventDefault()
      window.botpressWebChat.sendEvent({ type: 'show' })
    }
  }

  const closeEmulator = e => {
    window.botpressWebChat.sendEvent({ type: 'hide' })
  }

  const toggleDocs = e => {
    e.preventDefault()

    if (props.docHints.length) {
      window.open(`https://botpress.com/docs/${props.docHints[0]}`, '_blank')
    }
  }

  const toggleLangSwitcher = e => {
    e && e.preventDefault()
    if (!isInputFocused()) {
      setLangSwitcherOpen(() => {
        // lang switcher just closed
        if (!langSwitcherOpen) {
          focusMain()
        }
        return !langSwitcherOpen
      })
    }
  }

  const focusMain = () => {
    if (mainElRef?.current) {
      mainElRef.current.focus()
    }
  }

  const gotoUrl = url => {
    if (!isInputFocused()) {
      props.history.push(url)
      focusMain()
    }
  }

  const toggleBottomPanel = e => {
    e.preventDefault()
    props.toggleBottomPanel()
  }

  const goHome = () => {
    if (!isInputFocused()) {
      window.location.href = `${window.ROOT_PATH}/admin`
    }
  }

  if (props.viewMode < 0 || !props.translations) {
    return null
  }

  const keyHandlers = {
    'emulator-focus': focusEmulator,
    cancel: closeEmulator,
    'docs-toggle': toggleDocs,
    'bottom-bar': toggleBottomPanel,
    'lang-switcher': toggleLangSwitcher,
    'go-flow': () => gotoUrl('/flows'),
    'go-home': goHome,
    'go-content': () => gotoUrl('/content'),
    'go-module-code': () => gotoUrl('/modules/code-editor'),
    'go-module-qna': () => gotoUrl('/modules/qna'),
    'go-module-testing': () => gotoUrl('/modules/testing'),
    'go-module-analytics': () => gotoUrl('/modules/analytics'),
    'go-understanding': () => gotoUrl('/modules/nlu')
  }

  const splitPanelLastSizeKey = `bp::${window.BOT_ID}::bottom-panel-size`
  const lastSize = parseInt(localStorage.getItem(splitPanelLastSizeKey) || '175', 10)
  const bottomBarSize = props.bottomPanel ? lastSize : '100%'

  return (
    <Fragment>
      <HotKeys handlers={keyHandlers} id="mainLayout" className={layout.mainLayout}>
        <Sidebar />
        <div className={layout.container}>
          <Toolbar
            hasDoc={props.docHints?.length}
            toggleDocs={toggleDocs}
            onToggleEmulator={toggleEmulator}
            toggleBottomPanel={props.toggleBottomPanel}
          />
          <SplitPane
            split={'horizontal'}
            defaultSize={lastSize}
            onChange={size => size > 100 && localStorage.setItem(splitPanelLastSizeKey, size.toString())}
            size={bottomBarSize}
            maxSize={-100}
            className={layout.mainSplitPaneWToolbar}
          >
            <main ref={mainElRef} className={layout.main} id="main" tabIndex={9999}>
              <Switch>
                <Route
                  exact
                  path="/"
                  render={() => {
                    if (!window.IS_BOT_MOUNTED) {
                      return <Redirect to="/config" />
                    }

                    return window.USE_ONEFLOW ? <Redirect to="/oneflow" /> : <Redirect to="/flows" />
                  }}
                />
                <Route exact path="/content" component={Content} />
                <Route exact path="/flows/:flow*" component={FlowBuilder} />
                <Route exact path="/config" component={Config} />
                <Route exact path="/oneflow/:flow*" component={OneFlow} />
                <Route exact path="/modules/:moduleName/:componentName?" render={props => <Module {...props} />} />
                <Route exact path="/logs" component={Logs} />
              </Switch>
            </main>
            <BottomPanel />
          </SplitPane>

          <PluginInjectionSite site="overlay" />
          <BackendToast />
          <SelectContentManager />
          <GuidedTour isDisplayed={guidedTourOpen} onToggle={toggleGuidedTour} />
          <LanguageServerHealth />
        </div>
      </HotKeys>
      <StatusBar
        onToggleEmulator={toggleEmulator}
        langSwitcherOpen={langSwitcherOpen}
        toggleLangSwitcher={toggleLangSwitcher}
        onToggleGuidedTour={toggleGuidedTour}
        toggleBottomPanel={props.toggleBottomPanel}
      />
      <CommandPalette toggleEmulator={toggleEmulator} />
    </Fragment>
  )
}

const mapStateToProps = state => ({
  viewMode: state.ui.viewMode,
  docHints: state.ui.docHints,
  bottomPanel: state.ui.bottomPanel,
  translations: state.language.translations
})

const mapDispatchToProps = dispatch => bindActionCreators({ viewModeChanged, toggleBottomPanel }, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(Layout)

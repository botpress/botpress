import { Button, Divider, Tab, Tabs } from '@blueprintjs/core'
import { lang, ToolTip } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { Fragment, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { toggleBottomPanel, toggleBottomPanelExpand } from '~/actions'
import storage from '~/util/storage'

import style from './style.scss'
import Debugger from './Debugger'
import Logs from './Logs'

const BOTTOM_PANEL_TAB = 'bottomPanelTab'
const AUTO_FOCUS_DEBUGGER = 'autoFocusDebugger'

const BottomPanel = props => {
  const [tab, setTab] = useState<string>(storage.get(BOTTOM_PANEL_TAB) || 'debugger')
  const [autoFocusDebugger, setAutoFocusDebugger] = useState<any>(storage.get(AUTO_FOCUS_DEBUGGER) ?? true)
  const [eventId, setEventId] = useState()

  useEffect(() => {
    window.addEventListener('message', handleNewMessage)

    return () => {
      window.removeEventListener('message', handleNewMessage)
    }
  })

  const handleChangeTab = newTab => {
    storage.set(BOTTOM_PANEL_TAB, newTab)
    setTab(newTab)
  }

  const handleNewMessage = e => {
    if (!e.data || !e.data.action) {
      return
    }

    const { action, payload } = e.data
    if (action === 'load-event') {
      if (autoFocusDebugger) {
        handleChangeTab('debugger')
      }

      setEventId(payload.eventId)
    }
  }

  const handleAutoFocus = newValue => {
    setAutoFocusDebugger(newValue)
    storage.set(AUTO_FOCUS_DEBUGGER, newValue.toString())
  }

  const commonButtons = (
    <Fragment>
      <Divider />
      <ToolTip content={lang.tr(props.bottomPanelExpanded ? 'minimize' : 'maximize')}>
        <Button
          id="btn-toggle-expand"
          icon={props.bottomPanelExpanded ? 'minimize' : 'maximize'}
          small
          onClick={props.toggleBottomPanelExpand}
        />
      </ToolTip>

      <Divider />

      <ToolTip content={lang.tr('bottomPanel.closePanel')}>
        <Button id="btn-close" icon="cross" small onClick={props.toggleBottomPanel} />
      </ToolTip>
    </Fragment>
  )

  return (
    <div className={style.container}>
      <Tabs className={style.verticalTab} vertical onChange={tab => handleChangeTab(tab)} selectedTabId={tab}>
        <Tab id="debugger" title={lang.tr('debugger')} />
        <Tab id="logs" title={lang.tr('logs')} />
      </Tabs>

      <div className={cx(style.padded, style.fullWidth, { 'emulator-open': props.emulatorOpen })}>
        {tab === 'logs' && <Logs commonButtons={commonButtons} />}
        {tab === 'debugger' && (
          <Debugger
            eventId={eventId}
            autoFocus={autoFocusDebugger}
            setAutoFocus={handleAutoFocus}
            commonButtons={commonButtons}
          />
        )}
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  emulatorOpen: state.ui.emulatorOpen,
  bottomPanelExpanded: state.ui.bottomPanelExpanded
})

const mapDispatchToProps = dispatch => bindActionCreators({ toggleBottomPanel, toggleBottomPanelExpand }, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(BottomPanel)

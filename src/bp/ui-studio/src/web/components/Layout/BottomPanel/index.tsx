import { Button, Divider, Tab, Tabs } from '@blueprintjs/core'
import { lang, ToolTip, MainLayout } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { Fragment, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { toggleBottomPanel, toggleBottomPanelExpand } from '~/actions'
import storage from '~/util/storage'

import Debugger from './Debugger'
import Inspector, { DataEntry } from './Inspector'
import Logs from './Logs'
import style from './style.scss'

const MAX_HISTORY = 10
const BOTTOM_PANEL_TAB = 'bottomPanelTab'
const AUTO_FOCUS_DEBUGGER = 'autoFocusDebugger'

const DevPanel = MainLayout.BottomPanel

const BottomPanel = props => {
  const [tab, setTab] = useState<string>(storage.get(BOTTOM_PANEL_TAB) || 'debugger')
  const [autoFocusDebugger, setAutoFocusDebugger] = useState<any>(storage.get(AUTO_FOCUS_DEBUGGER) ?? true)
  const [eventId, setEventId] = useState()
  const [dataHistory, setDataHistory] = useState<DataEntry[]>([])
  const [customTabs, setCustomTabs] = useState([])

  useEffect(() => {
    window.addEventListener('message', handleNewMessage)

    window['inspect'] = data => {
      if (!data) {
        return
      }

      try {
        const id = data.name || data.id
        const entry = { id: typeof id === 'string' ? id : id.toString() || 'No name', data }

        setDataHistory([entry, ...dataHistory].slice(0, MAX_HISTORY))
      } catch (err) {
        console.error(`Inspect error ${err}`)
      }
    }

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

  // @ts-ignore
  DevPanel.Container.onTabsChanged = tabs => setCustomTabs(tabs)

  return (
    <div className={style.container}>
      <Tabs className={style.verticalTab} vertical onChange={tab => handleChangeTab(tab)} selectedTabId={tab}>
        <Tab id="debugger" title={lang.tr('debugger')} />
        <Tab id="logs" title={lang.tr('logs')} />
        {props.inspectorEnabled && <Tab id="inspector" title={lang.tr('inspector')} />}

        {customTabs.map(tab => {
          return <Tab id={tab} title={tab} />
        })}
      </Tabs>

      <div className={cx(style.padded, style.fullWidth)}>
        <DevPanel.Container activeTab={tab} />
        <Logs commonButtons={commonButtons} hidden={tab !== 'logs'} />

        <Debugger
          eventId={eventId}
          autoFocus={autoFocusDebugger}
          setAutoFocus={handleAutoFocus}
          commonButtons={commonButtons}
          hidden={tab !== 'debugger'}
        />

        <Inspector history={dataHistory} commonButtons={commonButtons} hidden={tab !== 'inspector'} />
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  emulatorOpen: state.ui.emulatorOpen,
  inspectorEnabled: state.ui.inspectorEnabled,
  bottomPanelExpanded: state.ui.bottomPanelExpanded
})

const mapDispatchToProps = dispatch => bindActionCreators({ toggleBottomPanel, toggleBottomPanelExpand }, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(BottomPanel)

import { Divider, Icon } from '@blueprintjs/core'
import { Collapsible, lang, MainLayout, sharedStyle, Tabs } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { useContext, useEffect, useState } from 'react'

import { WEBSOCKET_TOPIC } from '../../constants'

import { IHandoff, ISocketMessage } from './../../types'
import AgentList from './studio-sidebar/components/AgentList'
import HandoffList from './studio-sidebar/components/HandoffList'
import { Context, Store } from './studio-sidebar/Store'
import styles from './style.scss'
import { Api, castHandoff } from './Api'

const Sidebar = ({ bp, close }) => {
  const api = Api(bp)

  const { state, dispatch } = useContext(Context)

  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({ agents: true, handoffs: true })

  function handleMessage(message: ISocketMessage) {
    switch (message.resource) {
      case 'agent':
        return dispatch({ type: 'setAgent', payload: message })
      case 'handoff':
        return dispatch({
          type: 'setHandoff',
          payload: _.thru(message, () => {
            message.payload = castHandoff(message.payload as IHandoff)
            return message
          })
        })
      default:
        return
    }
  }

  async function getHandoffs() {
    try {
      const data = await api.getHandoffs('handoffs.createdAt', false, 5)
      dispatch({ type: 'setHandoffs', payload: data })
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  async function getAgents() {
    try {
      const data = await api.getAgents()
      dispatch({ type: 'setAgents', payload: data.filter(a => a.online) })
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  useEffect(() => {
    Promise.all([getHandoffs(), getAgents()]).then(() => {
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    bp.events.on(`${WEBSOCKET_TOPIC}:${window.BOT_ID}`, handleMessage)
    return () => bp.events.off(`${WEBSOCKET_TOPIC}:${window.BOT_ID}`, handleMessage)
  }, [])

  return (
    <MainLayout.RightSidebar className={sharedStyle.wrapper} canOutsideClickClose close={() => close()}>
      <div className={sharedStyle.formHeader}>
        <Tabs tabs={[{ id: 'content', title: lang.tr('module.hitlnext.sidebar.tab') }]} />
      </div>

      <div
        className={cx(styles.sidebar)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          height: '100%'
        }}
      >
        <div style={{ width: '100%' }}>
          <Collapsible
            opened={expanded.handoffs}
            toggleExpand={() => setExpanded({ ...expanded, handoffs: !expanded.handoffs })}
            name={lang.tr('module.hitlnext.sidebar.handoffs.heading')}
          >
            <HandoffList handoffs={state.handoffs} loading={loading}></HandoffList>
          </Collapsible>
        </div>

        <div style={{ width: '100%' }}>
          <Collapsible
            opened={expanded.agents}
            toggleExpand={() => setExpanded({ ...expanded, agents: !expanded.agents })}
            name={lang.tr('module.hitlnext.sidebar.agents.heading')}
          >
            <AgentList agents={state.agents} loading={loading}></AgentList>
          </Collapsible>
        </div>

        <div style={{ marginTop: 'auto', paddingBottom: 20 }}>
          <Divider style={{ marginBottom: 10 }}></Divider>
          <a href={'hitlPath'}>
            <Icon icon="headset" style={{ marginRight: 10 }}></Icon>
            {lang.tr('module.hitlnext.sidebar.access')}
          </a>
        </div>
      </div>
    </MainLayout.RightSidebar>
  )
}

export default ({ bp, close }) => {
  return (
    <Store>
      <Sidebar bp={bp} close={close} />
    </Store>
  )
}

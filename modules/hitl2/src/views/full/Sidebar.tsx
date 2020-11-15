import { Divider, Icon } from '@blueprintjs/core'
import { Collapsible, lang, MainLayout, sharedStyle, Tabs } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { useContext, useEffect, useState } from 'react'

import { EscalationType, SocketMessageType } from './../../types'
import AgentList from './studio-sidebar/components/AgentList'
import EscalationList from './studio-sidebar/components/EscalationList'
import { Context, Store } from './studio-sidebar/Store'
import styles from './style.scss'
import { Api, castEscalation } from './Api'

const Sidebar = ({ bp, close }) => {
  const api = Api(bp)

  const { state, dispatch } = useContext(Context)

  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({ agents: true, escalations: true })

  function handleMessage(message: SocketMessageType) {
    switch (message.resource) {
      case 'agent':
        return dispatch({ type: 'setAgent', payload: message })
      case 'escalation':
        return dispatch({
          type: 'setEscalation',
          payload: _.thru(message, () => {
            message.payload = castEscalation(message.payload as EscalationType)
            return message
          })
        })
      default:
        return
    }
  }

  async function getEscalations() {
    try {
      const data = await api.getEscalations('escalations.createdAt', false, 5)
      dispatch({ type: 'setEscalations', payload: data })
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  async function getAgents() {
    try {
      const data = await api.getAgents(true)
      dispatch({ type: 'setAgents', payload: data })
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  useEffect(() => {
    Promise.all([getEscalations(), getAgents()]).then(() => {
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    bp.events.on(`hitl2:${window.BOT_ID}`, handleMessage)
    return () => bp.events.off(`hitl2:${window.BOT_ID}`, handleMessage)
  }, [])

  return (
    <MainLayout.RightSidebar className={sharedStyle.wrapper} canOutsideClickClose close={() => close()}>
      <div className={sharedStyle.formHeader}>
        <Tabs tabs={[{ id: 'content', title: lang.tr('module.hitl2.sidebar.tab') }]} />
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
            opened={expanded.escalations}
            toggleExpand={() => setExpanded({ ...expanded, escalations: !expanded.escalations })}
            name={lang.tr('module.hitl2.sidebar.escalations.heading')}
          >
            <EscalationList escalations={state.escalations} loading={loading}></EscalationList>
          </Collapsible>
        </div>

        <div style={{ width: '100%' }}>
          <Collapsible
            opened={expanded.agents}
            toggleExpand={() => setExpanded({ ...expanded, agents: !expanded.agents })}
            name={lang.tr('module.hitl2.sidebar.agents.heading')}
          >
            <AgentList agents={state.agents} loading={loading}></AgentList>
          </Collapsible>
        </div>

        <div style={{ marginTop: 'auto', paddingBottom: 20 }}>
          <Divider style={{ marginBottom: 10 }}></Divider>
          <a href={'hitlPath'}>
            <Icon icon="headset" style={{ marginRight: 10 }}></Icon>
            {lang.tr('module.hitl2.sidebar.access')}
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

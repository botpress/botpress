import _ from 'lodash'
import React, { useEffect, useState } from 'react'

import { Api } from './Api'

import { EscalationsMapType, AgentsMapType } from './Store'
import { SocketMessageType } from './../../types'

import { Divider, Icon } from '@blueprintjs/core'
import { MainContent, Tabs, lang, sharedStyle } from 'botpress/shared'
import Collapsible from '../../../../../src/bp/ui-shared-lite/Collapsible'

import AgentList from './Components/Sidebar/AgentList'
import EscalationList from './Components/Sidebar/EscalationList'

const Sidebar = ({ bp }) => {
  const api = Api(bp)

  const [agents, setAgents] = useState({} as AgentsMapType)
  const [escalations, setEscalations] = useState({} as EscalationsMapType)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({ agents: true, escalations: true })

  function handleMessage(message: SocketMessageType) {
    console.log('handleMessage')
    switch (message.resource) {
      case 'agent':
        setAgents({
          ...agents,
          [message.id]: {
            ...agents[message.id],
            ...message.payload
          }
        } as AgentsMapType)
        return
      case 'escalation':
        setEscalations({
          ...escalations,
          [message.id]: {
            ...escalations[message.id],
            ...message.payload
          }
        } as EscalationsMapType)
        return
      default:
        throw new Error('Invalid websocket message type')
    }
  }

  async function getEscalations() {
    try {
      const data = await api.getEscalations('escalations.createdAt', 'asc', 5)
      setEscalations(_.keyBy(data, 'id'))
    } catch (error) {
    }
  }

  async function getAgents() {
    try {
      const data = await api.getAgents(true)
      setAgents(_.keyBy(data, 'id'))
    } catch (error) {
    }
  }

  useEffect(() => {
    Promise.all([getEscalations(), getAgents()]).then(() => {
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    bp.events.on('hitl2', handleMessage)
    return () => bp.events.off('hitl2', handleMessage)
  }, [])

  console.log('agents', agents)
  console.log('escalations', escalations)

  return (
    <MainContent.RightSidebar className={sharedStyle.wrapper} canOutsideClickClose close={() => close()}>
      <div className={sharedStyle.formHeader}>
        <Tabs tabs={[{ id: 'content', title: lang.tr('module.hitl2.sidebar.tab') }]} />
      </div>

      <div
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
            <EscalationList escalations={escalations} loading={loading}></EscalationList>
          </Collapsible>
        </div>

        <div style={{ width: '100%' }}>
          <Collapsible
            opened={expanded.agents}
            toggleExpand={() => setExpanded({ ...expanded, agents: !expanded.agents })}
            name={lang.tr('module.hitl2.sidebar.agents.heading')}
          >
            <AgentList agents={agents} loading={loading}></AgentList>
          </Collapsible>
        </div>

        <div style={{ marginTop: 'auto', paddingBottom: '20px' }}>
          <Divider style={{ marginBottom: '10px' }}></Divider>
          <a href={hitlPath}>
            <Icon icon="headset" style={{ marginRight: '10px' }}></Icon>
            {lang.tr('module.hitl2.sidebar.access')}
          </a>
        </div>
      </div>
    </MainContent.RightSidebar>
  )
}

export default Sidebar

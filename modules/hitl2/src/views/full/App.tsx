import { lang, MainLayout, Tabs, toast } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { useContext, useEffect, useState } from 'react'

import { IEscalation, ISocketMessage } from '../../types'

import AgentList from './app/components/AgentList'
import AgentProfile from './app/components/AgentProfile'
import ConversationContainer from './app/components/ConversationContainer'
import EmptyConversation from './app/components/EmptyConversation'
import EscalationList from './app/components/EscalationList'
import { Context, Store } from './app/Store'
import style from './style.scss'
import { Api, castEscalation } from './Api'

const App = ({ bp }) => {
  const api = Api(bp)

  const { state, dispatch } = useContext(Context)

  const [loading, setLoading] = useState(true)

  function handleMessage(message: ISocketMessage) {
    switch (message.resource) {
      case 'agent':
        return dispatch({ type: 'setAgent', payload: message })
      case 'escalation':
        return dispatch({
          type: 'setEscalation',
          payload: _.thru(message, () => {
            message.payload = castEscalation(message.payload as IEscalation)
            return message
          })
        })
      default:
        return
    }
  }

  async function getCurrentAgent() {
    try {
      const agent = await api.getCurrentAgent()
      dispatch({ type: 'setCurrentAgent', payload: agent })
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  async function getAgents() {
    try {
      const agents = await api.getAgents()
      dispatch({ type: 'setAgents', payload: agents })
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  async function getEscalations() {
    try {
      const escalations = await api.getEscalations()
      dispatch({ type: 'setEscalations', payload: escalations })
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  async function getConfig() {
    try {
      const config = await api.getConfig()
      dispatch({ type: 'setConfig', payload: config })
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  async function toggleOnline(online: boolean) {
    try {
      const agent = online ? await api.setOnline() : await api.setOffline()
      dispatch({ type: 'setCurrentAgent', payload: agent }) // optimistic update, will also be updated via websocket event
      online
        ? toast.success(lang.tr('module.hitl2.agent.onlineSuccess'))
        : toast.success(lang.tr('module.hitl2.agent.offlineSuccess'))
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    Promise.all([getCurrentAgent(), getAgents(), getEscalations(), getConfig()]).then(() => {
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    bp.events.on(`hitl2:${window.BOT_ID}`, handleMessage)
    return () => bp.events.off(`hitl2:${window.BOT_ID}`, handleMessage)
  }, [])

  useEffect(() => {
    if (state.error) {
      toast.failure(`Error: ${state.error.response.data?.message}`)
    }
  }, [state.error])

  return (
    <div className={style.app}>
      <div className={style.mainNav}>
        <AgentList loading={loading} agents={state.agents} />
        <AgentProfile toggleOnline={toggleOnline} loading={loading} {...state.currentAgent} />
      </div>

      <div className={style.mainContent}>
        <div className={cx(style.sidebar, style.column)}>
          <EscalationList escalations={state.escalations} loading={loading} />
        </div>
        {!state.currentEscalation && <EmptyConversation />}
        {state.currentEscalation && <ConversationContainer bp={bp} api={api} />}
      </div>
      <script src="assets/modules/channel-web/inject.js"></script>
    </div>
  )
}

export default ({ bp }) => {
  return (
    <Store>
      <App bp={bp} />
    </Store>
  )
}

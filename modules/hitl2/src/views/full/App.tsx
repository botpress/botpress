import { lang, MainLayout, toast } from 'botpress/shared'
import _ from 'lodash'
import React, { useContext, useEffect, useState } from 'react'

import { EscalationType, SocketMessageType } from './../../types'
import AgentProfile from './app/components/AgentProfile'
import ConversationContainer from './app/components/ConversationContainer'
import EscalationList from './app/components/EscalationList'
import { Context, Store } from './app/Store'
import style from './style.scss'
import { Api, castEscalation } from './Api'

const App = ({ bp }) => {
  const api = Api(bp)

  const { state, dispatch } = useContext(Context)

  const [loading, setLoading] = useState(true)

  function handleMessage(message: SocketMessageType) {
    switch (message.resource) {
      case 'agent':
        return dispatch({ type: 'setAgent', payload: message })
      case 'escalation':
        if (message.type == 'create') {
          dispatch({
            type: 'setRead',
            payload: {
              [message.id]: message.payload.userConversation.createdOn
            }
          })
        }

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
    Promise.all([getCurrentAgent(), getAgents(), getEscalations()]).then(() => {
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    bp.events.on('hitl2', handleMessage)
    return () => bp.events.off('hitl2', handleMessage)
  }, [])

  useEffect(() => {
    if (state.error) {
      if (state.error.response) {
        toast.failure(`Error: ${state.error.response.data.message}`)
      } else {
        toast.failure(`Error: ${state.error}`)
      }
    }
  }, [state.error])

  const leftHeaderButtons = [
    {
      element: <AgentProfile toggleOnline={toggleOnline} loading={loading} {...state.currentAgent} />
    }
  ]

  return (
    <div className={style.app}>
      <MainLayout.Header leftButtons={leftHeaderButtons} />
      <div className={style.mainContent}>
        <div className={style.sidebar}>
          <EscalationList escalations={state.escalations} loading={loading} />
        </div>
        <div className={style.content}>
          <ConversationContainer bp={bp} api={api} escalation={state.currentEscalation} />
        </div>
      </div>
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

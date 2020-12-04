import { AxiosInstance } from 'axios'
import { lang, toast } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, useContext, useEffect, useState } from 'react'

import { IHandoff, ISocketMessage } from '../../types'

import { WEBSOCKET_TOPIC } from './../../constants'
import AgentList from './app/components/AgentList'
import AgentProfile from './app/components/AgentProfile'
import ConversationContainer from './app/components/ConversationContainer'
import EmptyConversation from './app/components/EmptyConversation'
import HandoffList from './app/components/HandoffList'
import { Context, Store } from './app/Store'
import style from './style.scss'
import { Api, castHandoff } from './Api'

interface Props {
  bp: { axios: AxiosInstance; events: any }
}

const App: FC<Props> = ({ bp }) => {
  const api = Api(bp)

  const { state, dispatch } = useContext(Context)

  const [loading, setLoading] = useState(true)

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

  async function getHandoffs() {
    try {
      const handoffs = await api.getHandoffs()
      dispatch({ type: 'setHandoffs', payload: handoffs })
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

  async function setOnline(online: boolean) {
    try {
      online ? await api.setOnline(true) : await api.setOnline(false)
      online
        ? toast.success(lang.tr('module.hitlnext.agent.onlineSuccess'))
        : toast.success(lang.tr('module.hitlnext.agent.offlineSuccess'))
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  useEffect(() => {
    Promise.all([getCurrentAgent(), getAgents(), getHandoffs(), getConfig()]).then(() => {
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    bp.events.on(`${WEBSOCKET_TOPIC}:${window.BOT_ID}`, handleMessage)

    return () => bp.events.off(`${WEBSOCKET_TOPIC}:${window.BOT_ID}`, handleMessage)
  }, [])

  useEffect(() => {
    if (state.error) {
      const message = _.get(state.error, 'response.data.message') || state.error.message
      toast.failure(`Error: ${message}`)
    }
  }, [state.error])

  return (
    <div className={style.app}>
      <div className={style.mainNav}>
        <AgentList loading={loading} agents={state.agents} />
        <AgentProfile setOnline={setOnline} loading={loading} {...state.currentAgent} />
      </div>

      <div className={style.mainContent}>
        <div className={cx(style.sidebar, style.column)}>
          <HandoffList handoffs={state.handoffs} loading={loading} />
        </div>
        {!state.selectedHandoffId && <EmptyConversation />}
        {state.selectedHandoffId && <ConversationContainer bp={bp} api={api} />}
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

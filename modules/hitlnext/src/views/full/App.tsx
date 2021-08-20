import { AxiosInstance } from 'axios'
import { lang, toast, PermissionOperation } from 'botpress/shared'
// @ts-ignore - provided by the studio
import { isOperationAllowed } from 'botpress/utils'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, useContext, useEffect, useState } from 'react'

import { IHandoff, ISocketMessage } from '../../types'
import { castHandoff, makeClient } from '../client'

import { WEBSOCKET_TOPIC } from './../../constants'
import AgentList from './app/components/AgentList'
import AgentStatus from './app/components/AgentStatus'
import ConversationContainer from './app/components/ConversationContainer'
import EmptyConversation from './app/components/EmptyConversation'
import HandoffList from './app/components/HandoffList'
import SupervisorMenu from './app/components/SupervisorMenu'
import { Context, Store } from './app/Store'
import style from './style.scss'

interface Props {
  bp: { axios: AxiosInstance; events: any }
}

const App: FC<Props> = ({ bp }) => {
  const api = makeClient(bp)

  const { state, dispatch } = useContext(Context)

  const [loading, setLoading] = useState(true)

  const handoffCreatedNotification = _.debounce(async () => {
    if (document.visibilityState === 'hidden') {
      await flashSound()
    }
  }, 1000)

  const handoffUpdatedNotification = _.debounce(async () => {
    if (!document.hasFocus()) {
      flashTitle(lang.tr('module.hitlnext.newMessage'))
    }
  })

  function flashTitle(message: string) {
    const original = document.title
    document.title = message

    window.setTimeout(() => {
      document.title = original
    }, 1000)
  }

  async function flashSound() {
    const audio = new Audio(`${window.ROOT_PATH}/assets/modules/channel-web/notification.mp3`)
    await audio.play().catch(err => {}) // swallow, see https://goo.gl/xX8pDD
  }

  async function handleMessage(message: ISocketMessage) {
    switch (message.resource) {
      case 'agent':
        return dispatch({ type: 'setAgent', payload: message })
      case 'handoff':
        if (message.type === 'update') {
          await handoffUpdatedNotification()
        } else if (message.type === 'create') {
          await handoffCreatedNotification()
        }
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

  async function getAllAgents() {
    try {
      const agents = await api.getAllAgents()
      dispatch({ type: 'setAgents', payload: agents })
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  async function getAgentsUsers() {
    try {
      const agentsUsers = await api.getAgentsUsers()
      dispatch({ type: 'setAgentsUsers', payload: agentsUsers })
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
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    Promise.all([getCurrentAgent(), getAllAgents(), getAgentsUsers(), getHandoffs(), getConfig()]).then(() => {
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

  function hasSupervisorPermission(operation: PermissionOperation): boolean {
    const perm = isOperationAllowed({ operation, resource: 'module.hitlnext.supervisor' })
    return perm
  }

  return (
    <div className={style.app}>
      <div className={style.mainNav}>
        <AgentList loading={loading} agents={state.agents} />
        <SupervisorMenu
          bp={bp}
          getAgentsUsers={getAgentsUsers}
          agents={state.agentsUsers}
          disabled={!hasSupervisorPermission('write')}
        />
        <AgentStatus setOnline={setOnline} loading={loading} {...state.currentAgent} />
      </div>

      <div className={style.mainContent}>
        <div className={cx(style.sidebar, style.column)}>
          <HandoffList handoffs={state.handoffs} loading={loading} />
        </div>
        {!state.selectedHandoffId && <EmptyConversation />}
        {state.selectedHandoffId && <ConversationContainer bp={bp} api={api} />}
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

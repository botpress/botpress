import { AxiosInstance } from 'axios'
import React, { FC, useContext, useEffect } from 'react'

import { WEBSOCKET_TOPIC } from '../../constants'
import { makeClient } from '../client'

import { ISocketMessage } from './../../types'
import { Context, Store } from './agentStatus/Store'
import AgentIcon from './shared/components/AgentIcon'

interface Props {
  bp: { axios: AxiosInstance; events: any }
}

const AgentStatus: FC<Props> = ({ bp }) => {
  const api = makeClient(bp)

  const { state, dispatch } = useContext(Context)

  function handleMessage(message: ISocketMessage) {
    switch (message.resource) {
      case 'agent':
        return dispatch({ type: 'setAgent', payload: message })
      default:
        return
    }
  }

  async function getCurrentAgent() {
    try {
      const data = await api.getCurrentAgent()
      dispatch({ type: 'setCurrentAgent', payload: data })
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getCurrentAgent()
  }, [])

  useEffect(() => {
    bp.events.on(`${WEBSOCKET_TOPIC}:${window.BOT_ID}`, handleMessage)
    return () => bp.events.off(`${WEBSOCKET_TOPIC}:${window.BOT_ID}`, handleMessage)
  }, [])

  return <AgentIcon online={state.currentAgent?.online} />
}

export default ({ bp }) => {
  return (
    <Store>
      <AgentStatus bp={bp} />
    </Store>
  )
}

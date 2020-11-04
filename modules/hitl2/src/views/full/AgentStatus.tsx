import { Context, Store } from './agentStatus/Store'
import React, { useContext, useEffect } from 'react'

import AgentIcon from './shared/components/AgentIcon'
import { Api } from './Api'
import { SocketMessageType } from './../../types'

const AgentStatus = ({ bp }) => {
  const api = Api(bp)

  const { state, dispatch } = useContext(Context)

  function handleMessage(message: SocketMessageType) {
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
    getCurrentAgent()
  }, [])

  useEffect(() => {
    bp.events.on('hitl2', handleMessage)
    return () => bp.events.off('hitl2', handleMessage)
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

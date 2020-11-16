import React, { useContext, useEffect } from 'react'

import { ISocketMessage } from './../../types'
import { Context, Store } from './agentStatus/Store'
import AgentIcon from './shared/components/AgentIcon'
import { Api } from './Api'

const AgentStatus = ({ bp }) => {
  const api = Api(bp)

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
    getCurrentAgent()
  }, [])

  useEffect(() => {
    bp.events.on(`hitl2:${window.BOT_ID}`, handleMessage)
    return () => bp.events.off(`hitl2:${window.BOT_ID}`, handleMessage)
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

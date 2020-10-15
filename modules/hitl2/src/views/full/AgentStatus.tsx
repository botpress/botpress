import _ from 'lodash'
import React, { useContext, useEffect } from 'react'

import { Api } from './Api'
import { Store, Context } from './agentStatus/Store'

import { SocketMessageType } from './../../types'

import { Icon } from '@blueprintjs/core'

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

  return (
    <div style={{ position: 'relative' }}>
      <Icon icon="headset"></Icon>
      {state.currentAgent?.online ? (
        <span
          style={{
            top: -3,
            right: -3,
            width: '6px',
            height: '6px',
            position: 'absolute',
            backgroundColor: '#0d8050',
            borderRadius: '5px'
          }}
        ></span>
      ) : null}
    </div>
  )
}

export default ({ bp }) => {
  return (
    <Store>
      <AgentStatus bp={bp} />
    </Store>
  )
}

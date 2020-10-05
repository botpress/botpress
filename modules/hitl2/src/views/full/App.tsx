import React, { useContext, useEffect, useState } from 'react'

import { Api } from './Api'
import { Context } from './Store'

import { SocketMessageType } from './../../types'

import { toast } from 'botpress/shared'
import { Grid, Row, Col } from 'react-flexbox-grid'

import AgentList from './Components/AgentList'
import EscalationList from './Components/EscalationList'

import style from './style.scss'

const App = ({ bp }) => {
  const api = Api(bp)

  const { state, dispatch } = useContext(Context)

  const [escalationsLoading, setEscalationsLoading] = useState(true)

  function subscribe() {
    bp.events.on('hitl2', (message: SocketMessageType) => {
      switch (message.type) {
        case 'update':
          return dispatch({ type: 'updateSocketMessage', payload: message })
        case 'create':
          return dispatch({ type: 'createSocketMessage', payload: message })
        default:
          throw new Error('Invalid websocket message type')
      }
    })
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

  useEffect(() => {
    Promise.all([getCurrentAgent(), getAgents(), getEscalations()]).then(() => {
      setEscalationsLoading(false)
    })
  }, [])

  useEffect(() => {
    subscribe()
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

  return (
    <Grid>
      <Row>
        <Col>
          <AgentList agents={state.agents}></AgentList>
        </Col>
      </Row>
      <Row>
        <Col md={4}>
          <EscalationList api={api} escalations={state.escalations} loading={escalationsLoading}></EscalationList>
        </Col>
      </Row>
    </Grid>
  )
}

export default App

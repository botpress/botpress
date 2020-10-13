import React, { FC, useContext, useState, useEffect } from 'react'
import _ from 'lodash'
import moment from 'moment'

import { ApiType } from '../Api'
import { EscalationType } from '../../../types'

import { Context } from '../Store'

import { Grid, Row, Col } from 'react-flexbox-grid'
import { Icon, Button } from '@blueprintjs/core'
import { toast, lang } from 'botpress/shared'
import EscalationBadge from './EscalationBadge'

type Props = {
  api: ApiType
} & EscalationType

const EscalationItem: FC<Props> = props => {
  const { api } = props

  const { state, dispatch } = useContext(Context)

  const [fromNow, setFromNow] = useState(moment(props.createdAt).fromNow())

  async function handleSelect(id: string) {
    dispatch({ type: 'setCurrentEscalation', payload: id })
  }

  async function handleAssign() {
    try {
      const escalation = await api.assignEscalation(props.id)
      api.setOnline()
      toast.success(lang.tr('module.hitl2.escalation.assign', { id: escalation.id }))
    } catch (error) {
      if (_.inRange(error.response.status, 400, 499)) {
        toast.failure(error.response.data.errors[0].detail)
      } else {
        dispatch({ type: 'setError', payload: error })
      }
    }
  }

  async function handleResolve() {
    try {
      const escalation = await api.resolveEscalation(props.id)
      api.setOnline()
      toast.success(lang.tr('module.hitl2.escalation.resolve', { id: escalation.id }))
    } catch (error) {
      if (_.inRange(error.response.status, 400, 499)) {
        toast.failure(error.response.data.errors[0].detail)
      } else {
        dispatch({ type: 'setError', payload: error })
      }
    }
  }

  useEffect(() => {
    const refreshRate = 1000 * 60 // ms

    const interval = setInterval(() => {
      setFromNow(moment(props.createdAt).fromNow())
    }, refreshRate)
    return () => clearInterval(interval)
  }, [])

  return (
    <Grid>
      <Row between="xs">
        <Col>{state.currentEscalation?.id == props.id ? <Icon icon="dot" intent="primary"></Icon> : null}</Col>
        <Col>
          <p>Id: {props.id}</p>
          <p className="bp3-text-small bp3-text-muted">
            {lang.tr('module.hitl2.escalation.created', { date: fromNow })}
          </p>
          <p>From: {props.userConversation.channel}</p>
        </Col>
        <Col>
          <EscalationBadge
            status={props.status}
            assignedToAgent={state.agents[props.agentId]}
            currentAgent={state.currentAgent}
          ></EscalationBadge>
        </Col>
      </Row>
      <Row>
        <Col>
          <Button onClick={() => handleSelect(props.id)}>Select</Button>
          <Button onClick={handleAssign}>Assign to me</Button>
          <Button onClick={handleResolve}>Resolve</Button>
        </Col>
      </Row>
    </Grid>
  )
}

export default EscalationItem

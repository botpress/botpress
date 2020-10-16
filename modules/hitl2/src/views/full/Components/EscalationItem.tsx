import React, { FC, useContext, useState, useEffect } from 'react'
import _ from 'lodash'
import moment from 'moment'
import cx from 'classnames'

import { EscalationType } from '../../../types'

import { Context } from '../app/Store'

import { Icon } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import EscalationBadge from './EscalationBadge'

import styles from './../style.scss'

const EscalationItem: FC<EscalationType> = props => {
  const { state, dispatch } = useContext(Context)

  const [readStatus, setReadStatus] = useState(true)
  const [fromNow, setFromNow] = useState(moment(props.createdAt).fromNow())

  async function handleSelect(id: string) {
    dispatch({ type: 'setCurrentEscalation', payload: id })
    dispatch({ type: 'setRead', payload: id })
  }

  useEffect(() => {
    const refreshRate = 1000 * 60 // ms

    const interval = setInterval(() => {
      setFromNow(moment(props.createdAt).fromNow())
    }, refreshRate)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    state.reads[props.id] && props.userConversation.createdOn > state.reads[props.id]
      ? setReadStatus(false)
      : setReadStatus(true)
  }, [state.reads, props.userConversation])

  return (
    <div
      className={cx(styles.escalationItem)}
      style={{
        backgroundColor: state.currentEscalation?.id == props.id ? 'var(--hover-ocean)' : null
      }}
      onClick={() => handleSelect(props.id)}
    >
      <div style={{ minWidth: 16, textAlign: 'center' }}>
        {!readStatus && <Icon icon="dot" intent="primary"></Icon>}
      </div>
      <div>
        <p>#{props.id}</p>
        <p className="bp3-text-small bp3-text-muted">{lang.tr('module.hitl2.escalation.created', { date: fromNow })}</p>
        <p>From: {props.userConversation.channel}</p>
        <p>{readStatus}</p>
      </div>
      <div style={{ marginLeft: 'auto' }}>
        <EscalationBadge
          status={props.status}
          assignedToAgent={state.agents[props.agentId]}
          currentAgent={state.currentAgent}
        ></EscalationBadge>
      </div>
    </div>
  )
}

export default EscalationItem

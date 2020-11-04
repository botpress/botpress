import React, { FC, useContext, useEffect, useState } from 'react'
import { generateUsername, getOrSet } from './../utils'

import { Context } from '../Store'
import EscalationBadge from './EscalationBadge'
import { EscalationType } from '../../../../types'
import { Text } from '@blueprintjs/core'
import _ from 'lodash'
import cx from 'classnames'
import { lang } from 'botpress/shared'
import moment from 'moment'
import style from './../../style.scss'

interface Props {
  api: ApiType
  escalation: EscalationType
}

const EscalationItem: FC<Props> = ({ api, escalation }) => {
  if (!escalation) {
    return null
  }
  const { createdAt, userConversation, id, status, agentId } = escalation
  const { state, dispatch } = useContext(Context)

  const [defaultUsername, setDefaultUsername] = useState()
  const [readStatus, setReadStatus] = useState(true)
  const [fromNow, setFromNow] = useState(moment(createdAt).fromNow())

  async function handleSelect(id: string) {
    dispatch({ type: 'setCurrentEscalation', payload: id })
    dispatch({ type: 'setRead', payload: id })
  }

  useEffect(() => {
    const refreshRate = 1000 * 60 // ms

    const interval = setInterval(() => {
      setFromNow(moment(createdAt).fromNow())
    }, refreshRate)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    state.reads[id] && userConversation.createdOn > state.reads[id] ? setReadStatus(false) : setReadStatus(true)
  }, [state.reads, userConversation])

  useEffect(() => {
    const key = _.get(escalation.userConversation.event, 'target')
    const username = getOrSet(
      () => {
        return _.get(state, `defaults.user.${key}.username`)
      },
      value => {
        dispatch({
          type: 'setDefault',
          payload: {
            user: {
              [key]: {
                username: value
              }
            }
          }
        })
      },
      generateUsername()
    )

    setDefaultUsername(username)
  }, [escalation.userConversation])

  const printAgent = () => {
    // TODO Add condition to show "Previous agent: ..."
    if (!agentId) {
      return lang.tr('module.hitl2.escalation.noPreviousAgent')
    } else if (agentId === state.currentAgent?.id) {
      return lang.tr('module.hitl2.escalation.you')
    } else {
      return lang.tr('module.hitl2.escalation.agent', { agentName: state.agents?.[agentId]?.fullName })
    }
  }

  return (
    <div
      className={cx(style.escalationItem, { [style.active]: state.currentEscalation?.id == id })}
      onClick={() => handleSelect(id)}
    >
      {!readStatus && <span className={style.unreadDot}></span>}
      <div className={style.info}>
        {/* TODO add client name and click action here */}
        <button className={style.clientName} type="button">
          {_.get(escalation.userConversation.event, 'state.user.fullName') || defaultUsername}
        </button>{' '}
        #{id}
        <p>
          From {userConversation.channel} ⋅ {printAgent()}
        </p>
        <Text ellipsize={true}>{_.get(userConversation, 'event.preview')}</Text>
        <p className={style.createdDate}>{lang.tr('module.hitl2.escalation.created', { date: fromNow })}</p>
      </div>
      <div className={style.badge}>
        <EscalationBadge
          status={status}
          assignedToAgent={state.agents[agentId]}
          currentAgent={state.currentAgent}
        ></EscalationBadge>
      </div>
    </div>
  )
}

export default EscalationItem

import { Text } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import React, { FC, useContext, useEffect, useState } from 'react'

import { agentName } from '../../../../helper'
import { IHandoff } from '../../../../types'
import style from '../../style.scss'
import { Context } from '../Store'

import HandoffBadge from './HandoffBadge'
import UserName from './UserName'

const HandoffItem: FC<IHandoff> = ({ createdAt, id, status, agentId, userConversation, userChannel, user }) => {
  const { state, dispatch } = useContext(Context)
  moment.locale(lang.getLocale())
  const [readStatus, setReadStatus] = useState(false)
  const [fromNow, setFromNow] = useState(moment(createdAt).fromNow())

  async function handleSelect(id: string) {
    dispatch({ type: 'setSelectedHandoffId', payload: id })
    dispatch({
      type: 'setRead',
      payload: {
        [id]: state.handoffs[id].userConversation.createdOn
      }
    })
  }

  useEffect(() => {
    const refreshRate = ms('1m')

    const interval = setInterval(() => {
      setFromNow(moment(createdAt).fromNow())
    }, refreshRate)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (state.reads[id] < userConversation.createdOn) {
      setReadStatus(false)
    } else if (state.reads[id] >= userConversation.createdOn) {
      setReadStatus(true)
    }
  }, [userConversation, state.reads])

  const displayAgentName = () => {
    if (agentId && agentId === state.currentAgent?.agentId) {
      return lang.tr('module.hitlnext.handoff.you')
    } else if (agentId) {
      const agent = state.agents[agentId]
      return agentName(agent)
    }
  }
  const getHandoffStyle = (createdAt, status) => {
    const defaultHandoffAlert = 5
    if (
      status === 'pending' &&
      moment().diff(moment(createdAt)) > ms(`${state.config.handoffAlert || defaultHandoffAlert}m`)
    ) {
      return style.handoffItemUrgent
    }
    return style.handoffItem
  }

  return (
    <div
      className={cx(getHandoffStyle(createdAt, status), { [style.active]: state.selectedHandoffId === id })}
      onClick={() => handleSelect(id)}
    >
      {!readStatus && <span className={style.unreadDot}></span>}
      <div className={style.info}>
        <UserName user={user} />
        &nbsp;<strong>#{id}</strong>
        <p>
          <span>{lang.tr('module.hitlnext.handoff.from', { channel: userChannel })}</span> {agentId && '⋅'}{' '}
          <span>{displayAgentName()}</span>
        </p>
        <Text ellipsize={true}>{_.get(userConversation, 'event.preview')}</Text>
        <p className={style.createdDate}>{fromNow}</p>
        <HandoffBadge status={status}></HandoffBadge>
      </div>
    </div>
  )
}

export default HandoffItem

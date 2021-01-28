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
import { generateUsername, getOrSet } from '../utils'
import { Context } from '../Store'

import HandoffBadge from './HandoffBadge'

const HandoffItem: FC<IHandoff> = ({ createdAt, id, status, agentId, userConversation, userChannel }) => {
  const { state, dispatch } = useContext(Context)

  const [defaultUsername, setDefaultUsername] = useState()
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

  useEffect(() => {
    const key = _.get(userConversation.event, 'target')
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
  }, [userConversation])

  const userName = () => {
    return _.get(userConversation.event, 'state.user.fullName') || state.config.defaultUsername
      ? defaultUsername
      : lang.tr('module.hitlnext.user.anonymous')
  }

  const displayAgentName = () => {
    if (agentId && agentId === state.currentAgent?.agentId) {
      return lang.tr('module.hitlnext.handoff.you')
    } else if (agentId) {
      const agent = state.agents[agentId]
      return agentName(agent)
    }
  }

  return (
    <div
      className={cx(style.handoffItem, { [style.active]: state.selectedHandoffId === id })}
      onClick={() => handleSelect(id)}
    >
      {!readStatus && <span className={style.unreadDot}></span>}
      <div className={style.info}>
        <span className={style.clientName}>{userName()}</span> <strong>#{id}</strong>
        <p>
          <span>{lang.tr('module.hitlnext.handoff.from', { channel: userChannel })}</span> {agentId && '⋅'}{' '}
          <span>{displayAgentName()}</span>
        </p>
        <Text ellipsize={true}>{_.get(userConversation, 'event.preview')}</Text>
        <p className={style.createdDate}>{fromNow}</p>
      </div>
      <div className={style.badge}>
        <HandoffBadge status={status}></HandoffBadge>
      </div>
    </div>
  )
}

export default HandoffItem

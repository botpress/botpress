import React, { FC, useContext } from 'react'

import { Context } from './../Store'

import { ApiType } from './../Api'
import { AgentType } from './../../../types'

import { Button } from '@blueprintjs/core'
import { toast, lang } from 'botpress/shared'

type Props = {
  api: ApiType
} & Partial<AgentType>

const AgentProfile: FC<Props> = props => {
  const { dispatch } = useContext(Context)

  async function toggleOnline(online: boolean) {
    try {
      let agent
      if (online) {
        agent = await props.api.setOnline()
      } else {
        agent = await props.api.setOffline()
      }
      dispatch({ type: 'setCurrentAgent', payload: agent }) // optimistic update, will also be updated via websocket event
      online
        ? toast.success(lang.tr('module.hitl2.agent.onlineSuccess'))
        : toast.success(lang.tr('module.hitl2.agent.offlineSuccess'))
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  return (
    <div>
      <ul>
        <li>Online: {props.online ? 'online' : 'offline'}</li>
        <li>Id: {props.id}</li>
        <li>Name: {props.fullName}</li>
      </ul>

      {props.online ? (
        <Button onClick={() => toggleOnline(false)}>{lang.tr('module.hitl2.agent.getOffline')}</Button>
      ) : (
        <Button onClick={() => toggleOnline(true)}>{lang.tr('module.hitl2.agent.getOnline')}</Button>
      )}
    </div>
  )
}

export default AgentProfile

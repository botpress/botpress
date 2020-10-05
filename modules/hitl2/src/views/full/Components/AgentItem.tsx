import React, { FC } from 'react'
import { AgentType } from './../../../types'
import { lang } from 'botpress/shared'

const AgentItem: FC<Partial<AgentType>> = props => {
  return (
    <li>
      <ul>
        <li>
          <strong>Id: {props.id}</strong>
        </li>
        <li>Name: {props.fullName}</li>
        <li>Online: {props.online ? lang.tr('module.hitl2.agent.online') : lang.tr('module.hitl2.agent.offline')}</li>
      </ul>
    </li>
  )
}

export default AgentItem

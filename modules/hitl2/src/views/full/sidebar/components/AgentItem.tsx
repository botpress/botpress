import { lang } from 'botpress/shared'
import React, { FC } from 'react'

import { AgentType } from '../../../../types'

const AgentItem: FC<Partial<AgentType>> = props => {
  const agentName = () => {
    return [props.attributes.firstname, props.attributes.lastname].filter(Boolean).join(' ')
  }

  return (
    <li>
      <p>
        <strong>Id: {props.agentId}</strong>
      </p>
      <p>Name: {agentName()}</p>
      <p>Online: {props.online ? lang.tr('module.hitl2.agent.online') : lang.tr('module.hitl2.agent.offline')}</p>
    </li>
  )
}

export default AgentItem

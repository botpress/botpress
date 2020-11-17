import { lang } from 'botpress/shared'
import React, { FC } from 'react'

import { IAgent } from '../../../../types'

const AgentItem: FC<Partial<IAgent>> = props => {
  const agentName = () => {
    return [props.attributes.firstname, props.attributes.lastname].filter(Boolean).join(' ')
  }

  return (
    <li>
      <p>
        <strong>Id: {props.agentId}</strong>
      </p>
      <p>Name: {agentName()}</p>
      <p>Online: {props.online ? lang.tr('module.hitlnext.agent.online') : lang.tr('module.hitlnext.agent.offline')}</p>
    </li>
  )
}

export default AgentItem

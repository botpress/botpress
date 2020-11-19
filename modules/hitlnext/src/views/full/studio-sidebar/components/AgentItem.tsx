import { lang } from 'botpress/shared'
import { agentName } from '../../shared/helper'
import React, { FC } from 'react'

import { IAgent } from '../../../../types'

const AgentItem: FC<IAgent> = props => {
  return (
    <li>
      <p>
        <strong>Id: {props.agentId}</strong>
      </p>
      <p>Name: {agentName(props)}</p>
      <p>Online: {props.online ? lang.tr('module.hitlnext.agent.online') : lang.tr('module.hitlnext.agent.offline')}</p>
    </li>
  )
}

export default AgentItem

import { lang } from 'botpress/shared'
import React, { FC } from 'react'

import { AgentType } from '../../../../types'

const AgentItem: FC<Partial<AgentType>> = props => {
  return (
    <li>
      <p>
        <strong>Id: {props.id}</strong>
      </p>
      <p>Name: {props.fullName}</p>
      <p>Online: {props.online ? lang.tr('module.hitl2.agent.online') : lang.tr('module.hitl2.agent.offline')}</p>
    </li>
  )
}

export default AgentItem

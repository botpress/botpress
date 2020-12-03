import { lang } from 'botpress/shared'
import React, { FC } from 'react'

import { IAgent } from '../../../../types'
import { agentName } from '../../shared/helper'

const AgentItem: FC<IAgent> = props => {
  return (
    <li>
      <p>
        <strong>Id: {props.agentId}</strong>
      </p>
      <p>{lang.tr('module.hitlnext.agent.name', { name: agentName(props) })}</p>
      <p>
        {lang.tr('module.hitlnext.agent.status', {
          status: props.online ? lang.tr('module.hitlnext.agent.online') : lang.tr('module.hitlnext.agent.offline')
        })}
      </p>
    </li>
  )
}

export default AgentItem

import { lang } from 'botpress/shared'
import React, { FC } from 'react'

import { agentName } from '../../../../helper'
import { IAgent } from '../../../../types'

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

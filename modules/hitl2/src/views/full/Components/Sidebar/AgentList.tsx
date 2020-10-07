import _ from 'lodash'
import React, { FC } from 'react'

import { AgentType } from '../../../../types'
import { AgentsMapType } from '../../Store'

import { Spinner } from '@blueprintjs/core'
import AgentItem from './AgentItem'

interface Props {
  agents: AgentsMapType
  loading: boolean
}

const AgentList: FC<Props> = props => {
  return (
    <div>
      {props.loading && <Spinner></Spinner>}

      {!props.loading && (
        <ul>
          {_.values(props.agents).map((agent: AgentType) => (
            <AgentItem key={agent.id} {...agent}></AgentItem>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AgentList

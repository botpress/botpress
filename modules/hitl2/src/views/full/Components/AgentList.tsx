import _ from 'lodash'
import React, { FC, useContext } from 'react'

import { AgentType } from './../../../types'
import { AgentsMapType } from '../Store'

import AgentItem from './AgentItem'

interface Props {
  agents: AgentsMapType
}

const AgentList: FC<Props> = props => {
  return (
    <ul>
      {_.values(props.agents).map((agent: AgentType) => (
        <AgentItem key={agent.id} {...agent}></AgentItem>
      ))}
    </ul>
  )
}

export default AgentList

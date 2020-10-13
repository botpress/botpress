import _ from 'lodash'
import React, { FC } from 'react'

import { AgentType } from '../../../../types'
import { AgentsMapType } from '../../Store'

import { Spinner } from '@blueprintjs/core'
import { EmptyState, lang } from 'botpress/shared'
import AgentItem from './AgentItem'
import AgentsIcon from '../../Icons/AgentsIcon'

interface Props {
  agents: AgentsMapType
  loading: boolean
}

const AgentList: FC<Props> = props => {
  return (
    <div>
      {props.loading && <Spinner></Spinner>}

      {!props.loading && _.isEmpty(props.agents) && (
        <EmptyState icon={<AgentsIcon />} text={lang.tr('module.hitl2.sidebar.agents.empty')}></EmptyState>
      )}

      {!_.isEmpty(props.agents) && (
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

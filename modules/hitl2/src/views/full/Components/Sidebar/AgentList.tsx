import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { AgentType } from '../../../../types'
import { AgentsMapType } from '../../sidebar/Store'

import { Spinner } from '@blueprintjs/core'
import { EmptyState, lang } from 'botpress/shared'
import AgentItem from './AgentItem'
import AgentsIcon from '../../Icons/AgentsIcon'

interface Props {
  agents: AgentsMapType
  loading: boolean
}

const AgentList: FC<Props> = props => {
  const [items, setItems] = useState([])

  useEffect(() => {
    setItems(_.filter(props.agents, ['online', true]))
  }, [props.agents])

  return (
    <div>
      {props.loading && <Spinner></Spinner>}

      {!props.loading && _.isEmpty(items) && (
        <EmptyState icon={<AgentsIcon />} text={lang.tr('module.hitl2.sidebar.agents.empty')}></EmptyState>
      )}

      {!_.isEmpty(items) && (
        <ul>
          {_.values(items).map((agent: AgentType) => (
            <AgentItem key={agent.id} {...agent}></AgentItem>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AgentList

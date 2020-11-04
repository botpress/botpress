import { EmptyState, lang } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'
import _, { Dictionary } from 'lodash'

import AgentItem from './AgentItem'
import { AgentType } from '../../../../types'
import AgentsIcon from '../../Icons/AgentsIcon'
import { Spinner } from '@blueprintjs/core'

interface Props {
  agents: Dictionary<AgentType>
  loading: boolean
}

const AgentList: FC<Props> = props => {
  const [items, setItems] = useState([])

  useEffect(() => {
    setItems(_.filter(_.values(props.agents), ['online', true]))
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

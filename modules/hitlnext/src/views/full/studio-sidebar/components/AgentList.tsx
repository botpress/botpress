import { Spinner } from '@blueprintjs/core'
import { EmptyState, lang } from 'botpress/shared'
import _, { Dictionary } from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { IAgent } from '../../../../types'
import AgentsIcon from '../../Icons/AgentsIcon'

import AgentItem from './AgentItem'

interface Props {
  agents: Dictionary<IAgent>
  loading: boolean
}

const AgentList: FC<Props> = ({ agents, loading }) => {
  const [items, setItems] = useState<IAgent[]>([])

  useEffect(() => {
    setItems(_.filter(_.values(agents), ['online', true]))
  }, [agents])

  return (
    <div>
      {loading && <Spinner></Spinner>}

      {!loading && _.isEmpty(items) && (
        <EmptyState icon={<AgentsIcon />} text={lang.tr('module.hitlnext.sidebar.agents.empty')}></EmptyState>
      )}

      {!_.isEmpty(items) && (
        <ul>
          {_.values(items).map(agent => (
            <AgentItem key={agent.agentId} {...agent}></AgentItem>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AgentList

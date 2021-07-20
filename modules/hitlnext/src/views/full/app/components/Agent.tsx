import { WorkspaceUserWithAttributes } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC } from 'react'
import { Card } from '@blueprintjs/core'
import AgentActions from './AgentActions'

interface Props {
  agent: WorkspaceUserWithAttributes
}

const Agent: FC<Props> = ({ agent }) => {
  const test = async () => {
    console.log('button pressed')
  }

  return (
    <div key={`user-${agent.email}`}>
      <div style={{ display: 'flex' }}>
        <Card style={{ width: '100%' }}>
          <b>Email: </b>
          {agent.email}
          <div style={{ textAlign: 'right' }}>
            <AgentActions agent={agent} />
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Agent

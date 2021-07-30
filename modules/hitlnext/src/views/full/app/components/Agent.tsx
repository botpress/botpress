import { WorkspaceUserWithAttributes } from 'botpress/sdk'
import { AxiosInstance } from 'axios'

import _ from 'lodash'
import React, { FC } from 'react'
import { Card } from '@blueprintjs/core'
import AgentActions from './AgentActions'

interface Props {
  agent: WorkspaceUserWithAttributes
  onPasswordReset: (email, password) => void
  bp: { axios: AxiosInstance; events: any }
}

const Agent: FC<Props> = ({ agent, onPasswordReset, bp }) => {
  return (
    <div key={`user-${agent.email}`}>
      <div style={{ display: 'flex' }}>
        <Card style={{ width: '100%' }}>
          <b>Email: </b>
          {agent.email}
          <div style={{ textAlign: 'right' }}>
            <AgentActions agent={agent} onPasswordReset={onPasswordReset} bp={bp} />
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Agent

import { WorkspaceUserWithAttributes } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import moment from 'moment'
import React, { FC } from 'react'

interface Props {
  agent: WorkspaceUserWithAttributes
}

const Agent: FC<Props> = ({ agent }) => {
  return (
    <div key={`user-${agent.email}`}>
      <div style={{ display: 'flex' }}>{agent.email}</div>
    </div>
  )
}

export default Agent

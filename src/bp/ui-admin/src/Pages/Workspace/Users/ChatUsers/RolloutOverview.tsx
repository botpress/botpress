import { Tooltip } from '@blueprintjs/core'
import { WorkspaceRollout } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { rolloutInfo } from '~/Pages/Workspaces/RolloutStrategyModal'

import { fetchWorkspaceRollout } from '../../../../reducers/user'

interface Props {
  fetchWorkspaceRollout: () => void
  workspaceRollout: WorkspaceRollout
}

const RolloutOverview: FC<Props> = props => {
  useEffect(() => {
    props.fetchWorkspaceRollout()
  }, [])

  if (!props.workspaceRollout) {
    return null
  }

  const { rolloutStrategy, inviteCode, allowedUsages } = props.workspaceRollout
  const strategyInfo = rolloutInfo[rolloutStrategy]

  if (!strategyInfo) {
    return null
  }

  return (
    <div style={{ marginBottom: 10, display: 'flex' }}>
      <div className="infosquare">
        Current Strategy
        <br />
        <strong>
          <Tooltip content={strategyInfo.desc}>{strategyInfo.label}</Tooltip>
        </strong>
      </div>

      {strategyInfo.inviteRequired && (
        <div className="infosquare">
          Invite Code
          <br />
          <strong>{inviteCode}</strong> ({allowedUsages === -1 ? 'unlimited usage' : `${allowedUsages} usage left`})
        </div>
      )}
    </div>
  )
}

const mapStateToProps = state => ({
  workspaceRollout: state.user.workspaceRollout
})

export default connect(
  mapStateToProps,
  { fetchWorkspaceRollout }
)(RolloutOverview)

import { Tooltip } from '@blueprintjs/core'
import { WorkspaceRollout } from 'botpress/sdk'
import { lang } from 'botpress/shared'
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
        {lang.tr('admin.workspace.users.currentStrategy')}
        <br />
        <strong>
          <Tooltip content={strategyInfo.desc}>{strategyInfo.label}</Tooltip>
        </strong>
      </div>

      {strategyInfo.inviteRequired && (
        <div className="infosquare">
          {lang.tr('admin.workspace.users.inviteCode')}
          <br />
          <strong>{inviteCode}</strong> (
          {allowedUsages === -1
            ? lang.tr('admin.workspace.users.unlimitedUsage')
            : lang.tr('admin.workspace.users.usageLeft', { allowedUsages })}
          )
        </div>
      )}
    </div>
  )
}

const mapStateToProps = state => ({
  workspaceRollout: state.user.workspaceRollout
})

export default connect(mapStateToProps, { fetchWorkspaceRollout })(RolloutOverview)

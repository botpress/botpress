import { WorkspaceRollout } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'

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
  const inviteRequired = ['anonymous-invite', 'authenticated-invite'].includes(rolloutStrategy)

  return (
    <div style={{ marginBottom: 10 }}>
      <div>Current Strategy: {rolloutStrategy}</div>
      {inviteRequired && (
        <div>
          Invite Code: <strong>{inviteCode}</strong> (
          {allowedUsages === -1 ? 'unlimited usage' : `${allowedUsages} usage left`})
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

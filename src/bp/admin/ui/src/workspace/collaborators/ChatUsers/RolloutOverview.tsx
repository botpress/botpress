import { Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useEffect } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { AppState } from '~/app/rootReducer'

import { fetchWorkspaceRollout } from '~/workspace/workspaces/reducer'
import { rolloutInfo } from '~/workspace/workspaces/RolloutStrategyModal'
import style from '../style.scss'

type Props = ConnectedProps<typeof connector>

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
      <div className={style.infoSquare}>
        {lang.tr('admin.workspace.users.currentStrategy')}
        <br />
        <strong>
          <Tooltip content={strategyInfo.desc}>{strategyInfo.label}</Tooltip>
        </strong>
      </div>

      {strategyInfo.inviteRequired && (
        <div className={style.infoSquare}>
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

const mapStateToProps = (state: AppState) => ({
  workspaceRollout: state.workspaces.workspaceRollout
})

const connector = connect(mapStateToProps, { fetchWorkspaceRollout })
export default connector(RolloutOverview)

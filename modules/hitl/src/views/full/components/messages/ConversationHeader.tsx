import { Intent, Switch, Tag, Tooltip } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC } from 'react'

import { HitlApi } from '../../api'

interface Props {
  isPaused: boolean
  displayName: string
  sessionId: string
  api: HitlApi
}

export const ConversationHeader: FC<Props> = props => {
  const togglePause = async () => {
    await props.api.setPauseState(props.sessionId, props.isPaused ? 'unpause' : 'pause')
  }

  return (
    <div className="bph-conversation-header">
      <div className="summary">
        <span>{props.displayName}</span>
        {props.isPaused && <Tag intent={Intent.DANGER}>Paused</Tag>}
      </div>
      <Tooltip
        content={
          props.isPaused
            ? 'Resume this conversation (return user to bot)'
            : 'Pause this conversation (take over from bot)'
        }
        className="bph-conversation-toggle"
      >
        <Switch checked={!props.isPaused} onChange={togglePause} large={true} />
      </Tooltip>
    </div>
  )
}

import _ from 'lodash'
import React, { FC } from 'react'

interface Props {
  displayName: string
}

export const ConversationHeader: FC<Props> = props => {
  return (
    <div className="bph-conversation-header">
      <div className="summary">
        <span>{props.displayName}</span>
      </div>
    </div>
  )
}

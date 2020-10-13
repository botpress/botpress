import React, { FC, useContext } from 'react'
import moment from 'moment'

import { Context } from '../Store'

import { CommentType } from '../../../types'

const Comment: FC<CommentType> = props => {
  const { state } = useContext(Context)

  function formatDate(str) {
    return moment(str).format('DD/MM/YYYY')
  }

  const agent = state.agents[props.agentId]

  return (
    <div>
      <p>{props.content}</p>
      <p className="bp3-text-small bp3-text-muted">
        {formatDate(props.createdAt)} <span>⋅</span> {agent.fullName || agent.id}
      </p>
    </div>
  )
}

export default Comment

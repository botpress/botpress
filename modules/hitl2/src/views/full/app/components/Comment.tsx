import { ContentSection } from 'botpress/shared'
import moment from 'moment'
import React, { FC, useContext } from 'react'

import { CommentType } from '../../../../types'
import style from '../../style.scss'
import { Context } from '../Store'

const Comment: FC<CommentType> = props => {
  const { state } = useContext(Context)

  function formatDate(str) {
    return moment(str).format('DD/MM/YYYY')
  }

  const agent = state.agents[props.agentId]

  return (
    <ContentSection title={`#${props.escalationId}`}>
      <ul>
        <li>{props.content}</li>
      </ul>
      <p className={style.createdDate}>
        {formatDate(props.createdAt)} <span>⋅</span> {agent?.fullName || agent?.id}
      </p>
    </ContentSection>
  )
}

export default Comment

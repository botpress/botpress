import { ContentSection } from 'botpress/shared'
import moment from 'moment'
import React, { FC, useContext } from 'react'

import { CommentType } from '../../../../types'
import style from '../../style.scss'
import { Context } from '../Store'

interface Props {
  threadId: string
  comment: CommentType
}

const Comment: FC<Props> = ({ comment, threadId }) => {
  const { agentId, content, createdAt } = comment
  const { state } = useContext(Context)

  function formatDate(str) {
    return moment(str).format('DD/MM/YYYY')
  }

  const agent = state.agents[agentId]

  return (
    <ContentSection title={`#${threadId}`}>
      <ul>
        <li>{content}</li>
      </ul>
      <p className={style.createdDate}>
        {formatDate(createdAt)} <span>⋅</span> {agent?.fullName || agent?.id}
      </p>
    </ContentSection>
  )
}

export default Comment

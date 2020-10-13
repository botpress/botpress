import React, { FC } from 'react'

import { CommentType } from '../../../types'

import { Divider } from '@blueprintjs/core'
import { EmptyState, lang } from 'botpress/shared'
import Comment from './Comment'

interface Props {
  comments?: CommentType[]
}

const CommentList: FC<Props> = props => {
  return props.comments.length ? (
    <div>
      <ul>
        {props.comments.map(comment => {
          return <Comment key={comment.id} {...comment}></Comment>
        })}
      </ul>
    </div>
  ) : (
    <EmptyState text={lang.tr('module.hitl2.comments.empty')}></EmptyState>
  )
}

export default CommentList

import React, { FC } from 'react'

import { CommentType } from '../../../types'

import { Divider } from '@blueprintjs/core'
import { EmptyState, lang } from 'botpress/shared'
import Comment from './Comment'

interface Props {
  comments?: CommentType[]
}

const CommentList: FC<Props> = props => {
  return props.comments ? (
    <div>
      <Divider></Divider>
      <p>{lang.tr('modules.hitl2.comments.heading')}</p>
      <ul>
        {props.comments.map(comment => {
          return <Comment key={comment.id} {...comment}></Comment>
        })}
      </ul>
    </div>
  ) : (
    <EmptyState text={'No comments.'}></EmptyState>
  )
}

export default CommentList

import React, { FC } from 'react'
import { CommentType } from '../../../types'

const Comment: FC<CommentType> = props => {
  return <div>{props.content}</div>
}

export default Comment

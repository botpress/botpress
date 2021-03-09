import cx from 'classnames'
import React, { FC } from 'react'

import CommentItem from '../../../common/comment'
import { BlockProps } from '../Block'
import style from '../Components/style.scss'

type Props = Pick<BlockProps, 'node'>

const CommentContents: FC<Props> = ({ node }) => {
  return (
    <div className={cx(style.contentsWrapper)}>
      {node.onEnter?.map((item, i) => {
        return <CommentItem key={`${i}.${item}`} className={cx(style.contentWrapper, style.content)} text={item} />
      })}
    </div>
  )
}

export default CommentContents

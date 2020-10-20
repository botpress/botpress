import { Button, TextArea } from '@blueprintjs/core'
import React, { FC, useState } from 'react'

import style from '../style.scss'

import SendIcon from './SendIcon'

interface Props {
  onSubmit: (content: string) => Promise<any>
}

const CommentForm: FC<Props> = props => {
  const [content, setContent] = useState('')

  return (
    <div className={style.commentForm}>
      <textarea
        value={content}
        onChange={event => {
          setContent(event.target.value)
        }}
      ></textarea>
      <Button
        icon={<SendIcon />}
        onClick={() => {
          // tslint:disable-next-line: no-floating-promises
          props.onSubmit(content).then(() => {
            setContent('')
          })
        }}
      />
    </div>
  )
}

export default CommentForm

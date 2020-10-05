import React, { FC, useState } from 'react'
import { Button, TextArea } from '@blueprintjs/core'

interface Props {
  onSubmit: (content: string) => Promise<any>
}

const CommentForm: FC<Props> = props => {
  const [content, setContent] = useState('')

  return (
    <div>
      <TextArea
        fill={true}
        value={content}
        onChange={event => {
          setContent(event.target.value)
        }}
      ></TextArea>
      <Button
        onClick={() => {
          props.onSubmit(content).then(() => {
            setContent('')
          })
        }}
      >
        Send
      </Button>
    </div>
  )
}

export default CommentForm

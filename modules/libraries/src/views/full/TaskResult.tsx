import { TextArea } from '@blueprintjs/core'
import React, { FC } from 'react'

import style from './style.scss'

interface Props {
  message: string
}

const TaskResult: FC<Props> = props => {
  if (!props.message) {
    return null
  }

  return (
    <div className={style.result}>
      <strong>Installation Result</strong>
      <br></br>
      <TextArea rows={15} cols={120} value={props.message}></TextArea>
    </div>
  )
}

export default TaskResult

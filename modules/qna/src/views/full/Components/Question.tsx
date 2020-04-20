import React, { FC, useEffect, useState } from 'react'

import style from '../style.scss'

interface Props {
  question: any
}

const Question: FC<Props> = props => {
  console.log(props.question)

  return (
    <div className={style.questionWrapper}>
      <div>
        <h2>Question</h2>
      </div>
      <div>
        <h2>Answer</h2>
      </div>
    </div>
  )
}

export default Question

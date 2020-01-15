import _ from 'lodash'
import React, { FC } from 'react'

type props = {
  show: boolean
  onFeedback: (rating: number) => Promise<void>
}

export const FeedbackWrapper: FC<props> = props => {
  if (props.show) {
    return (
      <div>
        {props.children}
        <span style={{ cursor: 'pointer' }} onClick={() => props.onFeedback(1)}>
          👍
        </span>
        <span style={{ cursor: 'pointer' }} onClick={() => props.onFeedback(-1)}>
          👎
        </span>
      </div>
    )
  }

  return <div>{props.children}</div>
}

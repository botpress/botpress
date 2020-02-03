import _ from 'lodash'
import React, { FC, useState } from 'react'

import ThumbsDown from '../../icons/ThumbsDown'
import ThumbsUp from '../../icons/ThumbsUp'

type Props = {
  onFeedback: Function
}

export const InlineFeedback: FC<Props> = props => {
  const [feedbackSent, setFeedbackSent] = useState(false)

  const handleSendFeedback = feedback => {
    props.onFeedback(feedback)
    setFeedbackSent(true)
  }

  if (feedbackSent) {
    return null
  }

  return (
    <div className="bpw-message-feedback">
      <div>
        <span onClick={() => handleSendFeedback(1)}>
          <ThumbsUp />
        </span>

        <span onClick={() => handleSendFeedback(-1)}>
          <ThumbsDown />
        </span>
      </div>
    </div>
  )
}

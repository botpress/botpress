import { EventFeedback } from 'lite/typings'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import ThumbsDown from '../../icons/ThumbsDown'
import ThumbsUp from '../../icons/ThumbsUp'

interface Props {
  onFeedback: (feedback: number, eventId: string) => void
  incomingEventId: string
  eventFeedbacks: EventFeedback[]
}

export const InlineFeedback: FC<Props> = ({ eventFeedbacks, incomingEventId, onFeedback }) => {
  const [feedbackSent, setFeedbackSent] = useState(false)

  useEffect(() => {
    if (eventFeedbacks && eventFeedbacks.find(x => x.incomingEventId === incomingEventId && x.feedback != undefined)) {
      setFeedbackSent(true)
    }
  }, [eventFeedbacks])

  const handleSendFeedback = feedback => {
    onFeedback(feedback, incomingEventId)
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

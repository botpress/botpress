import { EventFeedback } from 'lite/typings'
import React, { FC, useEffect, useState } from 'react'

import ThumbsDown from '../../icons/ThumbsDown'
import ThumbsUp from '../../icons/ThumbsUp'

interface Props {
  onFeedback: (feedback: number, eventId: string) => void
  incomingEventId: string
  eventFeedbacks: EventFeedback[]
  intl: any
}

export const InlineFeedback: FC<Props> = ({ eventFeedbacks, incomingEventId, onFeedback, intl }) => {
  const [feedbackSent, setFeedbackSent] = useState(false)

  useEffect(() => {
    if (eventFeedbacks && eventFeedbacks.find(x => x.incomingEventId === incomingEventId && x.feedback != null)) {
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
        <button
          type="button"
          aria-label={intl.formatMessage({
            id: 'message.thumbsUp',
            defaultMessage: 'Thumbs Up'
          })}
          onClick={() => handleSendFeedback(1)}
        >
          <ThumbsUp />
        </button>

        <button
          type="button"
          aria-label={intl.formatMessage({
            id: 'message.thumbsDown',
            defaultMessage: 'Thumbs Down'
          })}
          onClick={() => handleSendFeedback(-1)}
        >
          <ThumbsDown />
        </button>
      </div>
    </div>
  )
}

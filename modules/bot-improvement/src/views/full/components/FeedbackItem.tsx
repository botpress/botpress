import React, { FC } from 'react'

import { FeedbackItem } from '../../../backend/typings'
import style from '../style.scss'

const FeedbackItemComponent: FC<{
  feedbackItem: FeedbackItem
  onItemClicked: () => void
  contentLang: string
}> = (props: { feedbackItem: FeedbackItem; onItemClicked: () => void; contentLang: string }) => {
  const { feedbackItem, contentLang, onItemClicked } = props

  return (
    <div className={style.feedbackItem} onClick={e => onItemClicked()}>
      <div>Event Id: {feedbackItem.eventId}</div>
      <div>Session ID: {feedbackItem.sessionId}</div>
      <div>Timestamp: {feedbackItem.timestamp}</div>
      <div>Source: {feedbackItem.source.type}</div>
      {feedbackItem.source.type === 'qna' && (
        <div>Detected Intent: {feedbackItem.source.qnaItem.data.questions[contentLang][0]}</div>
      )}
    </div>
  )
}

export default FeedbackItemComponent

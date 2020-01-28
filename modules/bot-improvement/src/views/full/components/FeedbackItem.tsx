import React, { FC } from 'react'

import { FeedbackItem, QnAItem } from '../../../backend/typings'
import style from '../style.scss'

const FeedbackItemComponent: FC<{
  feedbackItem: FeedbackItem
  onItemClicked: () => void
  contentLang: string
  qnaItems: QnAItem[]
}> = props => {
  const { feedbackItem, contentLang, onItemClicked, qnaItems } = props

  return (
    <div className={style.feedbackItem} onClick={e => onItemClicked()}>
      <div>Event Id: {feedbackItem.eventId}</div>
      <div>Session ID: {feedbackItem.sessionId}</div>
      <div>Timestamp: {feedbackItem.timestamp}</div>
      <div>Source: {feedbackItem.source.type}</div>
      {feedbackItem.source.type === 'qna' && (
        <div>
          <div>Detected Intent: {feedbackItem.source.qnaItem.data.questions[contentLang][0]}</div>
          <h3>Intent should have been</h3>
          <select onClick={e => e.stopPropagation()}>
            <option value="qna">QnA</option>
            <option value="start_goal">Start Goal</option>
          </select>
          <select>
            {qnaItems.map((i, idx) => (
              <option key={`qnaItem-${idx}`}>{i.data.questions[contentLang][0]}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

export default FeedbackItemComponent

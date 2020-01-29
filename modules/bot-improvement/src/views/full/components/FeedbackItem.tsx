import _ from 'lodash'
import React, { FC } from 'react'

import { FeedbackItem, QnAItem } from '../../../backend/typings'
import style from '../style.scss'

const FeedbackItemComponent: FC<{
  feedbackItem: FeedbackItem
  correctedActionType: string
  correctedObjectId: string
  onItemClicked: () => void
  contentLang: string
  qnaItems: QnAItem[]
  goals: string[]
  handleCorrectedActionTypeChange: (correctedActionType: string) => void
  handleCorrectedActionObjectIdChange: (correctedActionObjectId: string) => void
  handleSubmit: () => void
}> = props => {
  const {
    feedbackItem,
    correctedActionType,
    correctedObjectId,
    contentLang,
    onItemClicked,
    qnaItems,
    goals,
    handleCorrectedActionTypeChange,
    handleCorrectedActionObjectIdChange,
    handleSubmit
  } = props

  const getId = (prefix: string) => {
    return `${prefix}-${feedbackItem.eventId}`
  }

  const selectTypeId = getId('select-type')
  const objectId = getId('object')

  return (
    <div className={style.feedbackItem} onClick={e => onItemClicked()}>
      <div>Event Id: {feedbackItem.eventId}</div>
      <div>Session ID: {feedbackItem.sessionId}</div>
      <div>Timestamp: {feedbackItem.timestamp}</div>
      <div>Source: {feedbackItem.source.type}</div>
      <div>
        <h4>Detected Intent</h4>
        Type: {feedbackItem.source.type}
        {feedbackItem.source.type === 'qna' && (
          <div>Question: {feedbackItem.source.qnaItem.data.questions[contentLang][0]}</div>
        )}
        {feedbackItem.source.type === 'goal' && <div>Start Goal:</div>}
      </div>
      <div>
        <h4>Intent shoud have been:</h4>
        <label htmlFor={selectTypeId}>Type:</label>
        <select
          id={selectTypeId}
          onClick={e => e.stopPropagation()}
          onChange={e => handleCorrectedActionTypeChange(e.target.value)}
        >
          <option selected={correctedActionType === 'qna'} value="qna">
            QnA
          </option>
          <option selected={correctedActionType === 'start_goal'} value="start_goal">
            Start Goal
          </option>
        </select>

        {correctedActionType === 'qna' && <label htmlFor={objectId}>Question:</label>}
        {correctedActionType === 'start_goal' && <label htmlFor={objectId}>Goal:</label>}

        <select
          id={objectId}
          onClick={e => e.stopPropagation()}
          onChange={e => handleCorrectedActionObjectIdChange(e.target.value)}
        >
          {correctedActionType === 'qna' &&
            qnaItems.map((i, idx) => <option key={`qnaItem-${idx}`}>{i.data.questions[contentLang][0]}</option>)}
          {correctedActionType === 'start_goal' && goals.map((i, idx) => <option key={`goal-${idx}`}>{i}</option>)}
        </select>
      </div>

      <button onClick={e => handleSubmit()}>Mark as solved</button>
    </div>
  )
}

export default FeedbackItemComponent

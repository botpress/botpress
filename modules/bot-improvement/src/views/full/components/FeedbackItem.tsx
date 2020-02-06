import { Button, Card, Divider, Elevation, HTMLSelect, Label } from '@blueprintjs/core'
import _ from 'lodash'
import moment from 'moment'
import React, { FC } from 'react'

import { FeedbackItem, FeedbackItemStatus, Goal, QnAItem } from '../../../backend/typings'
import style from '../style.scss'

interface FeedbackItemComponentProps {
  feedbackItem: FeedbackItem
  correctedActionType: string
  correctedObjectId: string
  onItemClicked: () => void
  contentLang: string
  qnaItems: QnAItem[]
  goals: Goal[]
  handleCorrectedActionTypeChange: (correctedActionType: string) => void
  handleCorrectedActionObjectIdChange: (correctedActionObjectId: string) => void
  markAsSolved: () => void
  markAsPending: () => void
  status: FeedbackItemStatus
  current: boolean
}

const FeedbackItemComponent: FC<FeedbackItemComponentProps> = props => {
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
    markAsSolved,
    markAsPending,
    status,
    current
  } = props

  return (
    <Card
      interactive={true}
      elevation={current ? Elevation.THREE : Elevation.ZERO}
      className={`${style.feedbackItem} ` + (current ? style.current : '')}
      onClick={e => onItemClicked()}
    >
      <div style={{ marginRight: '5%' }}>
        <h4>Details</h4>
        <div>Event Id: {feedbackItem.eventId}</div>
        <div>Session ID: {feedbackItem.sessionId}</div>
        <div>Timestamp: {moment(feedbackItem.timestamp).format('MMMM Do YYYY, h:mm:ss a')}</div>
        <div>
          <h4>Detected Intent</h4>
          Type: {feedbackItem.source.type === 'qna' ? 'Q&A' : 'Start Goal'}
          {feedbackItem.source.type === 'qna' && (
            <div>Question: {feedbackItem.source.qnaItem.data.questions[contentLang][0]}</div>
          )}
          {feedbackItem.source.type === 'goal' && <div>Goal: {feedbackItem.source.goal.id}</div>}
        </div>
      </div>
      <Divider style={{ marginRight: '3%' }} />
      <div className={style.intentCorrectionForm}>
        <h4>Intent shoud have been:</h4>

        <Label>
          Type
          <HTMLSelect
            onClick={e => e.stopPropagation()}
            onChange={e => handleCorrectedActionTypeChange(e.target.value)}
            value={correctedActionType}
          >
            <option value="qna">Q&A</option>
            <option value="start_goal">Start Goal</option>
          </HTMLSelect>
        </Label>

        <Label>
          {correctedActionType === 'qna' ? 'Question' : 'Goal'}
          <HTMLSelect
            onClick={e => e.stopPropagation()}
            onChange={e => handleCorrectedActionObjectIdChange(e.target.value)}
            value={correctedObjectId}
          >
            {correctedActionType === 'qna' &&
              qnaItems.map((i, idx) => (
                <option key={`qnaItem-${idx}`} value={i.id}>
                  {i.data.questions[contentLang][0]}
                </option>
              ))}
            {correctedActionType === 'start_goal' &&
              goals.map((i, idx) => (
                <option key={`goal-${idx}`} value={i.id}>
                  {i.id}
                </option>
              ))}
          </HTMLSelect>
        </Label>

        {status === 'pending' && (
          <Button icon="tick" onClick={e => markAsSolved()}>
            Mark as solved
          </Button>
        )}
        {status === 'solved' && (
          <Button icon="issue" onClick={e => markAsPending()}>
            Mark as pending
          </Button>
        )}
      </div>
    </Card>
  )
}

export default FeedbackItemComponent

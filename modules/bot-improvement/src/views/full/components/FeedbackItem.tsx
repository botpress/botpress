import { Button, Card, Divider, Elevation, HTMLSelect, Label } from '@blueprintjs/core'
import _ from 'lodash'
import moment from 'moment'
import React, { FC } from 'react'

import { FeedbackItem, Goal, QnAItem } from '../../../backend/typings'
import { makeApi } from '../api'
import style from '../style.scss'

interface FeedbackItemComponentProps {
  bp: any
  contentLang: string
  feedbackItem: FeedbackItem
  qnaItems: QnAItem[]
  goals: Goal[]
  onItemClicked: () => void
  current: boolean
  saveHandler: (FeedbackItem) => void
  defaultQnaItemId: string
  defaultGoalId: string
}

const FeedbackItemComponent: FC<FeedbackItemComponentProps> = props => {
  const {
    bp,
    contentLang,
    feedbackItem,
    qnaItems,
    goals,
    onItemClicked,
    current,
    saveHandler,
    defaultGoalId,
    defaultQnaItemId
  } = props

  const api = makeApi(bp)

  const updateFeedbackItem = async changedProps => {
    const clone = _.cloneDeep(feedbackItem)
    _.merge(clone, changedProps)
    const { status, eventId, correctedActionType, correctedObjectId } = clone
    await api.updateFeedbackItem({
      status,
      eventId,
      correctedActionType,
      correctedObjectId
    })
    saveHandler(clone)
  }

  const markAsSolved = async () => {
    await updateFeedbackItem({ status: 'solved' })
  }

  const markAsPending = async () => {
    await updateFeedbackItem({ status: 'pending' })
  }

  const handleCorrectedActionTypeChange = async (correctedActionType: string) => {
    await updateFeedbackItem({
      correctedActionType,
      correctedObjectId: correctedActionType === 'qna' ? defaultQnaItemId : defaultGoalId
    })
  }

  const handleCorrectedActionObjectIdChange = async (correctedObjectId: string) => {
    await updateFeedbackItem({ correctedObjectId })
  }

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
          {feedbackItem.source.type === 'qna' && feedbackItem.source.qnaItem && (
            <div>Question: {feedbackItem.source.qnaItem?.data.questions[contentLang][0]}</div>
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
            value={feedbackItem.correctedActionType}
          >
            {qnaItems.length > 0 && <option value="qna">Q&A</option>}
            {goals.length > 0 && <option value="start_goal">Start Goal</option>}
          </HTMLSelect>
        </Label>

        <Label>
          {feedbackItem.correctedActionType === 'qna' ? 'Question' : 'Goal'}
          <HTMLSelect
            onClick={e => e.stopPropagation()}
            onChange={e => handleCorrectedActionObjectIdChange(e.target.value)}
            value={feedbackItem.correctedObjectId}
          >
            {feedbackItem.correctedActionType === 'qna' &&
              qnaItems.map((i, idx) => (
                <option key={`qnaItem-${idx}`} value={i.id}>
                  {i.data.questions[contentLang][0]}
                </option>
              ))}
            {feedbackItem.correctedActionType === 'start_goal' &&
              goals.map((i, idx) => (
                <option key={`goal-${idx}`} value={i.id}>
                  {i.id}
                </option>
              ))}
          </HTMLSelect>
        </Label>

        {feedbackItem.status === 'pending' && (
          <Button icon="tick" onClick={e => markAsSolved()}>
            Mark as solved
          </Button>
        )}
        {feedbackItem.status === 'solved' && (
          <Button icon="issue" onClick={e => markAsPending()}>
            Mark as pending
          </Button>
        )}
      </div>
    </Card>
  )
}

export default FeedbackItemComponent

import { Button, Card, Divider, Elevation, HTMLSelect, Label } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
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
        <h4>{lang.tr('module.bot-improvement.details')}</h4>
        <div>
          {lang.tr('module.bot-improvement.eventId')}: {feedbackItem.eventId}
        </div>
        <div>
          {lang.tr('module.bot-improvement.sessionId')}: {feedbackItem.sessionId}
        </div>
        <div>
          {lang.tr('module.bot-improvement.timestamp')}:{' '}
          {moment(feedbackItem.timestamp).format('MMMM Do YYYY, h:mm:ss a')}
        </div>
        <div>
          <h4>{lang.tr('module.bot-improvement.detectedIntent')}</h4>
          {lang.tr('module.bot-improvement.type')}:{' '}
          {feedbackItem.source.type === 'qna'
            ? lang.tr('module.bot-improvement.qna')
            : lang.tr('module.bot-improvement.startGoal')}
          {feedbackItem.source.type === 'qna' && feedbackItem.source.qnaItem && (
            <div>
              {lang.tr('module.bot-improvement.question')}:{' '}
              {feedbackItem.source.qnaItem?.data.questions[contentLang][0]}
            </div>
          )}
          {feedbackItem.source.type === 'goal' && (
            <div>
              {lang.tr('module.bot-improvement.goal')}: {feedbackItem.source.goal.id}
            </div>
          )}
        </div>
      </div>
      <Divider style={{ marginRight: '3%' }} />
      <div className={style.intentCorrectionForm}>
        <h4>{lang.tr('module.bot-improvement.intentShouldHaveBeen')}:</h4>

        <Label>
          {lang.tr('module.bot-improvement.type')}
          <HTMLSelect
            onClick={e => e.stopPropagation()}
            onChange={e => handleCorrectedActionTypeChange(e.target.value)}
            value={feedbackItem.correctedActionType}
          >
            {qnaItems.length > 0 && <option value="qna">{lang.tr('module.bot-improvement.qna')}</option>}
            {goals.length > 0 && <option value="start_goal">{lang.tr('module.bot-improvement.startGoal')}</option>}
          </HTMLSelect>
        </Label>

        <Label>
          {feedbackItem.correctedActionType === 'qna'
            ? lang.tr('module.bot-improvement.question')
            : lang.tr('module.bot-improvement.goal')}
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
            {lang.tr('module.bot-improvement.markSolved')}
          </Button>
        )}
        {feedbackItem.status === 'solved' && (
          <Button icon="issue" onClick={e => markAsPending()}>
            {lang.tr('module.bot-improvement.markPending')}
          </Button>
        )}
      </div>
    </Card>
  )
}

export default FeedbackItemComponent

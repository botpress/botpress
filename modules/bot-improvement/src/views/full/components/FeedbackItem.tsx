import { Button, Card, Divider, Elevation, HTMLSelect, Label, Radio, RadioGroup } from '@blueprintjs/core'
import { Dropdown, lang } from 'botpress/shared'
import cx from 'classnames'
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

  const handleTypeChanged = async (correctedActionType: string) => {
    await updateFeedbackItem({
      correctedActionType,
      correctedObjectId: correctedActionType === 'qna' ? defaultQnaItemId : defaultGoalId
    })
  }

  const handleObjectIdChanged = async (correctedObjectId: string) => {
    await updateFeedbackItem({ correctedObjectId })
  }

  const { correctedActionType, correctedObjectId, status, source } = feedbackItem

  const actionItems = [
    ...(correctedActionType === 'qna'
      ? qnaItems.map(x => ({ label: x.data.questions[contentLang][0], value: x.id }))
      : []),
    ...(correctedActionType === 'start_goal' ? goals.map(x => ({ label: x.id, value: x.id })) : [])
  ]

  return (
    <Card
      interactive
      elevation={current ? Elevation.THREE : Elevation.ZERO}
      className={cx(style.feedbackItem, { [style.current]: current })}
      onClick={e => onItemClicked()}
    >
      <div style={{ marginRight: '5%' }}>
        <h4>{lang.tr('module.bot-improvement.details')}</h4>
        <div>
          {lang.tr('module.bot-improvement.eventId')}: {feedbackItem.eventId}
        </div>
        <div>
          {lang.tr('module.bot-improvement.timestamp')}:{' '}
          {moment(feedbackItem.timestamp).format('MMMM Do YYYY, h:mm:ss a')}
        </div>
        <div>
          <h4>{lang.tr('module.bot-improvement.detectedIntent')}</h4>
          {lang.tr('module.bot-improvement.type')}:{' '}
          {source.type === 'qna' ? lang.tr('module.bot-improvement.qna') : lang.tr('module.bot-improvement.startGoal')}
          {source.type === 'qna' && source.qnaItem && (
            <div>
              {lang.tr('module.bot-improvement.question')}: {source.qnaItem?.data.questions[contentLang][0]}
            </div>
          )}
          {source.type === 'goal' && (
            <div>
              {lang.tr('module.bot-improvement.goal')}: {source.goal.id}
            </div>
          )}
        </div>
      </div>
      <Divider style={{ marginRight: '3%' }} />
      <div className={style.intentCorrectionForm}>
        <h4>{lang.tr('module.bot-improvement.intentShouldHaveBeen')}:</h4>

        <Label>
          {lang.tr('module.bot-improvement.type')}
          <RadioGroup
            onChange={e => handleTypeChanged(e.currentTarget.value)}
            selectedValue={correctedActionType}
            inline
          >
            <Radio label={lang.tr('module.bot-improvement.qna')} value="qna" />
            <Radio label={lang.tr('module.bot-improvement.startGoal')} value="start_goal" />
          </RadioGroup>
        </Label>

        <Label>
          {correctedActionType === 'qna'
            ? lang.tr('module.bot-improvement.question')
            : lang.tr('module.bot-improvement.goal')}

          <Dropdown
            items={actionItems}
            onChange={item => handleObjectIdChanged(item.value)}
            defaultItem={actionItems.find(x => x.value === correctedObjectId)}
          />
        </Label>

        {status === 'pending' && (
          <Button icon="tick" onClick={e => markAsSolved()}>
            {lang.tr('module.bot-improvement.markSolved')}
          </Button>
        )}
        {status === 'solved' && (
          <Button icon="issue" onClick={e => markAsPending()}>
            {lang.tr('module.bot-improvement.markPending')}
          </Button>
        )}
      </div>
    </Card>
  )
}

export default FeedbackItemComponent

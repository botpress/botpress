import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { FeedbackItem, Goal, QnAItem } from '../../../backend/typings'

import FeedbackItemComponent from './FeedbackItem'

interface FeedbackItemPanelProps {
  currentFeedbackItem?: FeedbackItem
  feedbackItems: FeedbackItem[]
  goals: Goal[]
  qnaItems: QnAItem[]
  bp: any
  contentLang: any
  onItemClicked: (clickedItem: FeedbackItem) => void
  onSave: (savedItem: FeedbackItem) => void
  defaultGoalId: string
  defaultQnaItemId: string
}

const FeedbackItemPanel: FC<FeedbackItemPanelProps> = ({
  feedbackItems,
  goals,
  qnaItems,
  bp,
  contentLang,
  onItemClicked,
  currentFeedbackItem,
  onSave,
  defaultGoalId,
  defaultQnaItemId
}) => {
  return (
    <div>
      {feedbackItems.map(item => {
        return (
          <FeedbackItemComponent
            key={`feedbackItem-${item.eventId}`}
            feedbackItem={item}
            onItemClicked={() => onItemClicked(item)}
            current={currentFeedbackItem && item.eventId === currentFeedbackItem.eventId}
            contentLang={contentLang}
            bp={bp}
            qnaItems={qnaItems}
            goals={goals}
            saveHandler={onSave}
            defaultGoalId={defaultGoalId}
            defaultQnaItemId={defaultQnaItemId}
          />
        )
      })}
    </div>
  )
}

export default FeedbackItemPanel

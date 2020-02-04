import { Callout, Icon } from '@blueprintjs/core'
import { Tab, Tabs } from '@blueprintjs/core'
import { Container } from 'botpress/ui'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { FeedbackItem, Goal, QnAItem } from '../../backend/typings'

import { makeApi } from './api'
import Conversation from './components/messages/Conversation'
import FeedbackItemComponent from './components/FeedbackItem'
import style from './style.scss'

type SelectedTabId = 'pending' | 'solved'

const defaultState: {
  feedbackItems: FeedbackItem[]
  qnaItems: QnAItem[]
  goals: Goal[]
  feedbackItemsLoading: boolean
  currentFeedbackItem: FeedbackItem
  selectedTab: SelectedTabId
} = {
  feedbackItems: [],
  qnaItems: [],
  goals: [],
  feedbackItemsLoading: true,
  currentFeedbackItem: null,
  selectedTab: 'pending'
}

const getDefaultQnaItemId = (qnaItems: QnAItem[]) => {
  return qnaItems[0].id
}

const getDefaultGoalId = (goals: Goal[]) => {
  return goals[0].id
}

export default props => {
  const { bp, contentLang } = props
  const api = makeApi(bp)

  const [state, setState] = useState(defaultState)

  const { qnaItems, goals, feedbackItems, feedbackItemsLoading } = state
  let { currentFeedbackItem } = state

  useEffect(() => {
    const initializeState = async () => {
      const qnaItems = await api.getQnaItems()
      const goals = await api.getGoals()

      const defaultQnaItemId = getDefaultQnaItemId(qnaItems)

      const feedbackItems = (await api.getFeedbackItems()).map(i => {
        i.correctedActionType = i.correctedActionType || 'qna'
        i.correctedObjectId = i.correctedObjectId || defaultQnaItemId
        i.status = i.status || 'pending'
        return i
      })

      setState(state => ({ ...state, feedbackItemsLoading: false, feedbackItems, goals, qnaItems }))
    }
    initializeState().catch(e => {
      throw e
    })
  }, [])

  if (feedbackItems.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', placeContent: 'center' }}>
        <Callout title={'No feedback items'} style={{ width: '30%', margin: 'auto' }}>
          Feedback items are created when chat users give negative feedback on bot messages
        </Callout>
      </div>
    )
  }

  if (feedbackItemsLoading) {
    return <Callout>Loading...</Callout>
  }

  const pendingFeedbackItems = feedbackItems.filter(i => i.status === 'pending')
  const solvedFeedbackItems = feedbackItems.filter(i => i.status === 'solved')

  if (!currentFeedbackItem) {
    currentFeedbackItem = pendingFeedbackItems[0]
  }

  const updateFeedbackItem = async (item: FeedbackItem, changedProps) => {
    const listClone = [...feedbackItems]
    const itemClone = _.cloneDeep(item)
    _.merge(itemClone, changedProps)

    const idx = listClone.findIndex(e => e.eventId === item.eventId)
    listClone[idx] = itemClone
    setState(state => ({ ...state, feedbackItems: listClone }))

    const { status, eventId, correctedActionType, correctedObjectId } = itemClone
    await api.updateFeedbackItem({
      status,
      eventId,
      correctedActionType,
      correctedObjectId
    })
  }

  const FeedbackItemPanel: FC<{ feedbackItems: FeedbackItem[] }> = props => {
    const { feedbackItems } = props
    return (
      <div>
        {feedbackItems.map(item => {
          const handleCorrectedActionTypeChange = async (correctedActionType: string) => {
            const defaultQnaItemId = getDefaultQnaItemId(qnaItems)
            const defaultGoalId = getDefaultGoalId(goals)

            await updateFeedbackItem(item, {
              correctedActionType,
              correctedObjectId: correctedActionType === 'qna' ? defaultQnaItemId : defaultGoalId
            })
          }

          const handleCorrectedActionObjectIdChange = async (correctedObjectId: string) => {
            await updateFeedbackItem(item, { correctedObjectId })
          }

          const markAsSolved = async () => {
            await updateFeedbackItem(item, { status: 'solved' })
          }

          const markAsPending = async () => {
            await updateFeedbackItem(item, { status: 'pending' })
          }

          return (
            <FeedbackItemComponent
              key={`feedbackItem-${item.eventId}`}
              feedbackItem={item}
              correctedActionType={item.correctedActionType}
              correctedObjectId={item.correctedObjectId}
              onItemClicked={() => {
                setState(state => ({ ...state, currentFeedbackItem: item }))
              }}
              current={item.eventId === currentFeedbackItem.eventId}
              contentLang={contentLang}
              qnaItems={qnaItems}
              goals={goals}
              handleCorrectedActionTypeChange={handleCorrectedActionTypeChange}
              handleCorrectedActionObjectIdChange={handleCorrectedActionObjectIdChange}
              markAsSolved={markAsSolved}
              markAsPending={markAsPending}
              status={item.status}
            />
          )
        })}
      </div>
    )
  }

  return (
    <Container sidePanelWidth={750}>
      <div className={style.feedbackItemsContainer}>
        <h2>Feedback Items</h2>
        <Tabs
          selectedTabId={state.selectedTab}
          onChange={(newTabId: SelectedTabId) => {
            if (newTabId === 'pending') {
              setState({ ...state, selectedTab: newTabId, currentFeedbackItem: pendingFeedbackItems[0] })
            } else {
              setState({ ...state, selectedTab: newTabId, currentFeedbackItem: solvedFeedbackItems[0] })
            }
          }}
        >
          <Tab
            id="pending"
            title={
              <>
                <Icon icon="issue" /> Pending
              </>
            }
            panel={<FeedbackItemPanel feedbackItems={pendingFeedbackItems} />}
          />
          <Tab
            id="solved"
            title={
              <>
                <Icon icon="tick" /> Solved
              </>
            }
            panel={<FeedbackItemPanel feedbackItems={solvedFeedbackItems} />}
          />
        </Tabs>
      </div>

      <Conversation api={api} feedbackItem={currentFeedbackItem || feedbackItems[0]} />
    </Container>
  )
}

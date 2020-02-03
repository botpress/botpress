import { Callout } from '@blueprintjs/core'
import { Tab, Tabs } from '@blueprintjs/core'
import { Container } from 'botpress/ui'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import '../../../assets/default.css'
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

export default props => {
  const { bp, contentLang } = props
  const api = makeApi(bp)

  const [state, setState] = useState(defaultState)

  const { qnaItems, goals, feedbackItems, feedbackItemsLoading } = state
  let { currentFeedbackItem } = state

  const defaultQnaItemId = qnaItems.length && qnaItems[0].id
  const defaultGoalId = goals.length && goals[0].id

  useEffect(() => {
    const initializeState = async () => {
      const qnaItems = await api.getQnaItems()
      const goals = await api.getGoals()

      const feedbackItems = (await api.getFeedbackItems()).map(i => {
        i.correctedActionType = i.correctedActionType || 'qna'
        i.correctedObjectId = i.correctedObjectId || defaultQnaItemId
        i.state = i.state || 'pending'
        return i
      })

      setState(state => ({ ...state, feedbackItemsLoading: false, feedbackItems, goals, qnaItems }))
    }
    initializeState().catch(e => {
      throw e
    })
  }, [])

  if (feedbackItemsLoading) {
    return <Callout>Loading...</Callout>
  }

  const pendingFeedbackItems = feedbackItems.filter(i => i.state === 'pending')
  const solvedFeedbackItems = feedbackItems.filter(i => i.state === 'solved')

  if (!currentFeedbackItem) {
    currentFeedbackItem = pendingFeedbackItems[0]
  }

  console.log(`currentFeedbackItem:`, currentFeedbackItem)

  const updateFeedbackItem = async (item: FeedbackItem, changedProps) => {
    const listClone = [...feedbackItems]
    const itemClone = _.cloneDeep(item)
    _.merge(itemClone, changedProps)

    const idx = listClone.findIndex(e => e.eventId === item.eventId)
    listClone[idx] = itemClone
    setState(state => ({ ...state, feedbackItems: listClone }))

    const { state, eventId, correctedActionType, correctedObjectId } = itemClone
    await api.updateFeedbackItem({
      state,
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
            await updateFeedbackItem(item, {
              correctedActionType,
              correctedObjectId: correctedActionType === 'qna' ? defaultQnaItemId : defaultGoalId
            })
          }

          const handleCorrectedActionObjectIdChange = async (correctedObjectId: string) => {
            await updateFeedbackItem(item, { correctedObjectId })
          }

          const markAsSolved = async () => {
            await updateFeedbackItem(item, { state: 'solved' })
          }

          const markAsPending = async () => {
            await updateFeedbackItem(item, { state: 'pending' })
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
              state={item.state}
            />
          )
        })}
      </div>
    )
  }

  return (
    <Container sidePanelWidth={1000}>
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
          <Tab id="pending" title="Pending" panel={<FeedbackItemPanel feedbackItems={pendingFeedbackItems} />} />
          <Tab id="solved" title="Solved" panel={<FeedbackItemPanel feedbackItems={solvedFeedbackItems} />} />
        </Tabs>
      </div>

      <div className="bph-layout-main">
        <div className="bph-layout-middle">
          <Conversation api={api} feedbackItem={currentFeedbackItem || feedbackItems[0]} />
        </div>
        <div className="bph-layout-profile">
          {/* {this.state.currentSession && (
            <Profile
              user={this.state.currentSession.user}
              lastHeardOn={this.state.currentSession.lastHeardOn}
              attributesConfig={this.state.attributesConfig}
            />
          )} */}
        </div>
      </div>
    </Container>
  )
}

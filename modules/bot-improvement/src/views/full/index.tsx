import { Callout } from '@blueprintjs/core'
import { Container } from 'botpress/ui'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'

import '../../../assets/default.css'
import { FeedbackItem, Goal, QnAItem } from '../../backend/typings'

import { makeApi } from './api'
import Conversation from './components/messages/Conversation'
import FeedbackItemComponent from './components/FeedbackItem'
import style from './style.scss'

const defaultState: {
  feedbackItems: FeedbackItem[]
  qnaItems: QnAItem[]
  goals: Goal[]
  feedbackItemsLoading: boolean
  currentFeedbackItemIdx: number
} = {
  feedbackItems: [],
  qnaItems: [],
  goals: [],
  feedbackItemsLoading: true,
  currentFeedbackItemIdx: 0
}

export default props => {
  const { bp, contentLang } = props
  const api = makeApi(bp)

  const [state, setState] = useState(defaultState)

  const { qnaItems, goals, feedbackItems, feedbackItemsLoading, currentFeedbackItemIdx } = state

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

  const currentFeedbackItem = feedbackItems[currentFeedbackItemIdx]

  return (
    <Container sidePanelWidth={1000}>
      <div className={style.feedbackItemsContainer}>
        <h2>Feedback Items</h2>
        {feedbackItems.map((item, i) => {
          const updateFeedbackItem = async changedProps => {
            const listClone = [...feedbackItems]
            const itemClone = _.cloneDeep(item)
            _.merge(itemClone, changedProps)

            listClone[i] = itemClone
            setState(state => ({ ...state, feedbackItems: listClone }))

            const { state, eventId, correctedActionType, correctedObjectId } = itemClone
            await api.updateFeedbackItem({
              state,
              eventId,
              correctedActionType,
              correctedObjectId
            })
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

          const markAsSolved = async () => {
            await updateFeedbackItem({ state: 'solved' })
          }

          const markAsPending = async () => {
            await updateFeedbackItem({ state: 'pending' })
          }

          return (
            <FeedbackItemComponent
              key={`feedbackItem-${i}`}
              feedbackItem={item}
              correctedActionType={item.correctedActionType}
              correctedObjectId={item.correctedObjectId}
              onItemClicked={() => {
                setState(state => ({ ...state, currentFeedbackItemIdx: i }))
              }}
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

      <div className="bph-layout-main">
        <div className="bph-layout-middle">
          <Conversation api={api} feedbackItem={currentFeedbackItem} />
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

import { Callout } from '@blueprintjs/core'
import { Container } from 'botpress/ui'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'

import '../../../assets/default.css'
import { FeedbackItem, FeedbackItemState, QnAItem } from '../../backend/typings'

import { makeApi } from './api'
import Conversation from './components/messages/Conversation'
import FeedbackItemComponent from './components/FeedbackItem'
import style from './style.scss'

export default props => {
  const { bp, contentLang } = props
  const api = makeApi(bp)

  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([])
  const [qnaItems, setQnaItems] = useState<QnAItem[]>([])
  const [feedbackItemsLoading, setFeedbackItemsLoading] = useState(true)
  const [currentFeedbackItemIdx, setCurrentFeedbackItemIdx] = useState(0)

  useEffect(() => {
    const fetchFeedbackItems = async () => {
      const qnaItems = await api.getQnaItems()
      setQnaItems(qnaItems)

      const feedbackItems = (await api.getFeedbackItems()).map(i => {
        i.correctedActionType = i.correctedActionType || 'qna'
        i.correctedObjectId = i.correctedObjectId || qnaItems[0].id
        return i
      })

      setFeedbackItems(feedbackItems)
      setFeedbackItemsLoading(false)
    }
    fetchFeedbackItems().catch(e => {
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
            setFeedbackItems(listClone)

            return itemClone
          }

          const handleCorrectedActionTypeChange = async (correctedActionType: string) => {
            await updateFeedbackItem({ correctedActionType })
          }

          const handleCorrectedActionObjectIdChange = async (correctedObjectId: string) => {
            await updateFeedbackItem({ correctedObjectId })
          }

          const markAsSolved = async () => {
            await saveItem('solved')
          }

          const markAsPending = async () => {
            await saveItem('pending')
          }

          const saveItem = async (state: FeedbackItemState) => {
            const itemClone = await updateFeedbackItem({ state })
            await api.updateFeedbackItem({
              state: itemClone.state,
              eventId: itemClone.eventId,
              correctedActionType: itemClone.correctedActionType,
              correctedObjectId: itemClone.correctedObjectId
            })
          }

          return (
            <FeedbackItemComponent
              key={`feedbackItem-${i}`}
              feedbackItem={item}
              correctedActionType={item.correctedActionType}
              correctedObjectId={item.correctedObjectId}
              onItemClicked={() => {
                setCurrentFeedbackItemIdx(i)
              }}
              contentLang={contentLang}
              qnaItems={qnaItems}
              goals={['goal1', 'goal2', 'goal3']}
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

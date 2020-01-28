import { Callout } from '@blueprintjs/core'
import { Container } from 'botpress/ui'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'

import '../../../assets/default.css'
import { FeedbackItem, QnAItem } from '../../backend/typings'

import { makeApi } from './api'
import Conversation from './components/messages/Conversation'
import FeedbackItemComponent from './components/FeedbackItem'

export default props => {
  const { bp, contentLang } = props
  const api = makeApi(bp)

  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([])
  const [qnaItems, setQnaItems] = useState<QnAItem[]>([])
  const [feedbackItemsLoading, setFeedbackItemsLoading] = useState(true)
  const [qnasLoading, setQnasLoading] = useState(true)
  const [currentFeedbackItemIdx, setCurrentFeedbackItemIdx] = useState(0)

  useEffect(() => {
    const fetchFeedbackItems = async () => {
      const feedbackItems = await api.getFeedbackItems()
      setFeedbackItems(feedbackItems)
      setFeedbackItemsLoading(false)
    }
    fetchFeedbackItems().catch(e => {
      throw e
    })
  }, [])

  useEffect(() => {
    const fetchQnAs = async () => {
      setQnaItems(await api.getQnaItems())
      setQnasLoading(false)
    }
    fetchQnAs().catch(e => {
      throw e
    })
  }, [])

  if (feedbackItemsLoading || qnasLoading) {
    return <Callout>Loading...</Callout>
  }

  const feedbackItem = feedbackItems[currentFeedbackItemIdx]
  console.log(`feedbackItem: ${feedbackItem}`)

  return (
    <Container sidePanelWidth={1000}>
      <div>
        <h2>Feedback Items</h2>
        {feedbackItems.map((item, i) => {
          return (
            <FeedbackItemComponent
              key={`feedbackItem-${i}`}
              feedbackItem={item}
              onItemClicked={() => {
                setCurrentFeedbackItemIdx(i)
              }}
              contentLang={contentLang}
              qnaItems={qnaItems}
            />
          )
        })}
      </div>

      <div className="bph-layout-main">
        <div className="bph-layout-middle">
          <Conversation api={api} feedbackItem={feedbackItem} />
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

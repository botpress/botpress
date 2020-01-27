import { Callout } from '@blueprintjs/core'
import { Container } from 'botpress/ui'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'

import '../../../assets/default.css'
import { FeedbackItem } from '../../backend/typings'

import { makeApi } from './api'
import Conversation from './components/messages/Conversation'
import FeedbackItemComponent from './components/FeedbackItem'

export default props => {
  const api = makeApi(props.bp)

  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentFeedbackItemIdx, setCurrentFeedbackItemIdx] = useState(0)

  useEffect(() => {
    const fetchFeedbackItems = async () => {
      const feedbackItems = await api.getFeedbackItems()
      setFeedbackItems(feedbackItems)
      setLoading(false)
    }
    fetchFeedbackItems().catch(e => {
      throw e
    })
  }, [])

  if (loading) {
    return <Callout>Loading...</Callout>
  }

  const feedbackItem = feedbackItems[currentFeedbackItemIdx]

  return (
    <Container sidePanelWidth={1000}>
      <div>
        <h2>Feedback Items</h2>
        {feedbackItems.map((item, i) => {
          return (
            <FeedbackItemComponent
              key={`feedback-${i}`}
              item={item}
              onItemClicked={() => {
                setCurrentFeedbackItemIdx(i)
              }}
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

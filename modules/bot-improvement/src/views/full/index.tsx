import { Callout, Icon, Tab, Tabs } from '@blueprintjs/core'
import { lang, ModuleUI } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { FeedbackItem, Goal, QnAItem } from '../../backend/typings'
import { makeApi } from './api'
import FeedbackItemPanel from './components/FeedbackItemPanel'
import Conversation from './components/messages/Conversation'
import style from './style.scss'

type SelectedTabId = 'pending' | 'solved'
const { Container } = ModuleUI

export default props => {
  const { bp, contentLang } = props
  const api = makeApi(bp)

  const [goals, setGoals] = useState<Goal[]>([])
  const [qnaItems, setQnaItems] = useState<QnAItem[]>([])
  const [defaultQnaItemId, setDefaultQnaItemId] = useState('')
  const [defaultGoalId, setDefaultGoalId] = useState('')
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([])
  const [feedbackItemsLoading, setFeedbackItemsLoading] = useState(true)
  const [currentFeedbackItem, setCurrentFeedbackItem] = useState<FeedbackItem>(undefined)
  const [selectedTabId, setSelectedTabId] = useState<SelectedTabId>('pending')

  useEffect(() => {
    const fetchGoals = async () => {
      const goals = await api.getGoals()
      setGoals(goals)
      setDefaultGoalId(goals[0].id)
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchGoals()
  }, [])

  useEffect(() => {
    const fetchQnaItems = async () => {
      const qnaItems = await api.getQnaItems()
      setQnaItems(qnaItems)
      setDefaultQnaItemId(qnaItems[0].id)
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchQnaItems()
  }, [])

  useEffect(() => {
    const initializeState = async () => {
      const feedbackItems = (await api.getFeedbackItems()).map(i => {
        i.correctedActionType = i.correctedActionType || 'qna'
        i.correctedObjectId = i.correctedObjectId || defaultQnaItemId
        i.status = i.status || 'pending'
        return i
      })

      setFeedbackItems(feedbackItems)
      setFeedbackItemsLoading(false)

      setCurrentFeedbackItem(getPendingFeedbackItems()[0])
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    initializeState()
  }, [])

  const getSolvedFeedbackItems = () => {
    return feedbackItems.filter(i => i.status === 'solved')
  }

  const getPendingFeedbackItems = () => {
    return feedbackItems.filter(i => i.status === 'pending')
  }

  if (!feedbackItems.length) {
    return (
      <div className={style.noFeedbackItems}>
        <Callout title={lang.tr('module.bot-improvement.noFeedbackItems')} style={{ width: '30%', margin: 'auto' }}>
          {lang.tr('module.bot-improvement.feedbackItemsCreated')}
        </Callout>
      </div>
    )
  }

  if (feedbackItemsLoading) {
    return <Callout>{lang.tr('module.bot-improvement.loading')}</Callout>
  }

  const updateFeedbackItem = async (item: FeedbackItem) => {
    const listClone = [...feedbackItems]
    const idx = listClone.findIndex(e => e.eventId === item.eventId)
    listClone[idx] = item
    setFeedbackItems(listClone)
  }

  return (
    <Container sidePanelWidth={750}>
      <div className={style.feedbackItemsContainer}>
        <h2>{lang.tr('module.bot-improvement.feedbackItems')}</h2>
        <Tabs
          selectedTabId={selectedTabId}
          onChange={(newTabId: SelectedTabId) => {
            setSelectedTabId(newTabId)
            if (newTabId === 'pending') {
              setCurrentFeedbackItem(getPendingFeedbackItems()[0])
            } else {
              setCurrentFeedbackItem(getSolvedFeedbackItems()[0])
            }
          }}
        >
          <Tab
            id="pending"
            title={
              <>
                <Icon icon="issue" /> {lang.tr('module.bot-improvement.pending')}
              </>
            }
            panel={
              <FeedbackItemPanel
                feedbackItems={getPendingFeedbackItems()}
                goals={goals}
                qnaItems={qnaItems}
                contentLang={contentLang}
                bp={bp}
                onItemClicked={clickedItem => {
                  setCurrentFeedbackItem(clickedItem)
                }}
                currentFeedbackItem={currentFeedbackItem}
                defaultGoalId={defaultGoalId}
                defaultQnaItemId={defaultQnaItemId}
                onSave={savedItem => updateFeedbackItem(savedItem)}
              />
            }
          />
          <Tab
            id="solved"
            title={
              <>
                <Icon icon="tick" /> {lang.tr('module.bot-improvement.solved')}
              </>
            }
            panel={
              <FeedbackItemPanel
                feedbackItems={getSolvedFeedbackItems()}
                goals={goals}
                qnaItems={qnaItems}
                contentLang={contentLang}
                bp={bp}
                onItemClicked={clickedItem => {
                  setCurrentFeedbackItem(clickedItem)
                }}
                currentFeedbackItem={currentFeedbackItem}
                defaultGoalId={defaultGoalId}
                defaultQnaItemId={defaultQnaItemId}
                onSave={savedItem => updateFeedbackItem(savedItem)}
              />
            }
          />
        </Tabs>
      </div>

      {currentFeedbackItem && <Conversation api={api} feedbackItem={currentFeedbackItem} />}
    </Container>
  )
}

import axios from 'axios'
import { NLU } from 'botpress/sdk'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import EventBus from '~/util/EventBus'

import style from './style.scss'

interface Props {
  currentLanguage: string
}

const BASE_NLU_URL = `${window.BOT_API_PATH}/mod/nlu`

// TODOs
// - move calls to core api
// - add translations in ui
// - styling

export const TrainingStatusComponent: FC<Props> = props => {
  // TODO change this for a reducer ?
  const [status, setStatus] = useState<NLU.TrainingStatus>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchTrainingStatus()

    EventBus.default.on('statusbar.event', onStatusBarEvent)
    const i = window.setInterval(() => status !== 'training' && fetchTrainingStatus(), 1500) // for training-needed
    return () => {
      clearInterval(i)
      EventBus.default.off('statusbar.event', onStatusBarEvent)
    }
  }, [])

  const onStatusBarEvent = async event => {
    const isNLUEvent = event.botId === window.BOT_ID && event.trainSession?.language === props.currentLanguage
    if (isNLUEvent) {
      updateState(event.trainSession as NLU.TrainingSession, false)
    }
  }

  const fetchTrainingStatus = async () => {
    try {
      const { data: session } = await axios.get(`${window.BOT_API_PATH}/mod/nlu/training/${props.currentLanguage}`)
      updateState(session as NLU.TrainingSession, true)
    } catch (err) {
      status !== 'needs-training' && onTrainingNeeded()
    }
  }

  const updateState = (session: NLU.TrainingSession, fromWS: boolean) => {
    setStatus(session.status)

    if (session.status === 'training') {
      onTrainingProgress(session.progress)
    } else if (session.status === 'errored') {
      onError()
    } else if (session.status === 'canceled') {
      onCanceling()
    } else if (session.status === 'needs-training') {
      onTrainingNeeded()
    } else if (session.status === 'idle' || session.status === 'done') {
      // shady timeout prevents adding embarrasing racecondition checks
      const delay = fromWS ? 0 : 750
      setTimeout(onTraingDone, delay)
    }
  }

  const onTrainingNeeded = () => setMessage('')
  const onTraingDone = () => setMessage('Ready') // TODO need translation for this
  const onCanceling = () => setMessage('Canceling') // TODO translate this
  const onError = () => setMessage('Cannot train chatbot')
  const onTrainingProgress = (progress: number) => {
    const p = Math.floor(progress * 100)
    setMessage(`Training ${p}%`)
  }

  const onTrainClicked = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    try {
      // TODO change this url for core ?
      await axios.post(`${BASE_NLU_URL}/train`)
    } catch (err) {
      onError()
    }
  }

  // TODO change this for /training/cancel
  const onCancelClicked = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    onCanceling()
    try {
      await axios.post(`${BASE_NLU_URL}/train/delete`)
    } catch (err) {
      // TODO better handle this, show error message with toast
      console.log('cannot cancel training')
    }
  }

  if (status === null) {
    return null
  } else {
    return (
      <div className={cx(style.item, style.progress)}>
        {message}

        {/* TODO translations for this */}
        {status === 'needs-training' && <button onClick={onTrainClicked}> Train</button>}
        {status === 'training' && <button onClick={onCancelClicked}>Cancel</button>}
      </div>
    )
  }
}

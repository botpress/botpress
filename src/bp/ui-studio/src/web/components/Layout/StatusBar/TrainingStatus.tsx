import axios from 'axios'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import EventBus from '~/util/EventBus'

import style from './style.scss'

type TrainingStatus = 'idle' | 'done' | 'needs-training' | 'training' | 'canceled' | null

interface TrainingSession {
  status: TrainingStatus
  language: string
  progress: number
}

interface Props {
  currentLanguage: string
}

// TODOs
// - display cancel button
// - canceling state
// - needs-training state
// - display / hide buttons given the current state
// - add translations in ui
// - remove autotrain

export const TrainingStatusComponent: FC<Props> = props => {
  // TODO change this for a reducer
  const [status, setStatus] = useState<TrainingStatus>(null)
  const [message, setMessage] = useState('') // change this for translated keys
  const [progress, setProgress] = useState('')

  useEffect(() => {
    fetchTrainingStatus()

    EventBus.default.on('statusbar.event', handleTrainingProgressEvent)
    const i = window.setInterval(() => status !== 'training', 2500) // can be done by events too ...
    return () => {
      clearInterval(i)
      EventBus.default.off('statusbar.event', handleTrainingProgressEvent)
    }
  }, [])

  const handleTrainingProgressEvent = async event => {
    const isNLUEvent = event.botId === window.BOT_ID && event.trainSession?.language === props.currentLanguage
    if (isNLUEvent) {
      console.log('training event', event.trainSession)
      const ts: TrainingSession = event.trainSession
      if (ts.status === 'training') {
        onTrainingProgress(ts)
      } else if (ts.status === 'done') {
        setTimeout(onTraingDone, 750) // prevents adding embarrasing racecondition checks
      }
    }
  }

  const fetchTrainingStatus = async () => {
    try {
      const { data: session } = await axios.get(`${window.BOT_API_PATH}/mod/nlu/training/${props.currentLanguage}`)
      if (session && session.status === 'training') {
        onTrainingProgress(session)
      } else if (session.status === 'idle') {
        onTraingDone()
      }
    } catch (err) {
      setStatus('needs-training')
    }
  }

  const onTraingDone = () => {
    setStatus('done')
    setMessage('Ready') // need translation for this
    setProgress('')
  }

  const onTrainingProgress = (trainSession: TrainingSession) => {
    setStatus(trainSession.status)
    setMessage('Training') // translation keys for this
    setProgress(`${Math.floor(trainSession.progress * 100)}%`)
  }

  const onTrainClicked = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    try {
      // TODO change this url for
      await axios.post(`${window.BOT_API_PATH}/mod/nlu/train`)
    } catch (err) {
      // TODO better handle this
      console.log('cannot train chatbot')
    }
  }

  return (
    <div className={cx(style.item, style.progress)}>
      {!!status && `${message} ${progress}`}
      <button onClick={onTrainClicked}>Train</button>
      {/* <button onClick={onCancelClicked}>Cancel</button> */}
    </div>
  )
}

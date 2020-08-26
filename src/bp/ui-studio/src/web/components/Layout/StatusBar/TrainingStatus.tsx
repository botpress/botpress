import { Button } from '@blueprintjs/core'
import axios from 'axios'
import { NLU } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import TrainingStatusObserver from '../training-status-observer'

import style from './style.scss'

interface Props {
  currentLanguage: string
}

// TODO change this url for core ?
const BASE_NLU_URL = `${window.BOT_API_PATH}/mod/nlu`

export const TrainingStatusComponent: FC<Props> = props => {
  const [status, setStatus] = useState<NLU.TrainingStatus>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const listener = {
      name: 'TrainingStatusComponent',
      cb: updateState,
      error: onTrainingNeeded
    }
    TrainingStatusObserver.addListener(listener)

    // tslint:disable-next-line: no-floating-promises
    TrainingStatusObserver.fetchTrainingStatus()

    return () => {
      TrainingStatusObserver.removeListener(listener)
    }
  }, [])

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
  const onTraingDone = () => setMessage(lang.tr('statusBar.ready'))
  const onCanceling = () => setMessage(lang.tr('statusBar.canceling'))
  const onError = () => setMessage(lang.tr('statusBar.trainingError'))
  const onTrainingProgress = (progress: number) => {
    const p = Math.floor(progress * 100)
    setMessage(`${lang.tr('statusBar.training')} ${p}%`)
  }

  const onTrainClicked = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    try {
      await axios.post(`${BASE_NLU_URL}/train`)
    } catch (err) {
      onError()
    }
  }

  const onCancelClicked = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    onCanceling()
    try {
      await axios.post(`${BASE_NLU_URL}/train/delete`)
    } catch (err) {
      console.log('cannot cancel training')
    }
  }

  if (status === null) {
    return null
  } else {
    return (
      <div className={style.item}>
        <span className={style.message}>{message}</span>

        {/*
            Button is displayed even when training is being cancelled because
            1. Sometimes training seems stuck and cancel is uneffective
            2. Training Cancelation is currently a long and unreliable process
            */}
        {['needs-training', 'canceled'].includes(status) && (
          <Button minimal className={style.button} onClick={onTrainClicked}>
            {lang.tr('statusBar.trainChatbot')}
          </Button>
        )}
        {status === 'training' && (
          <Button minimal className={cx(style.button, style.danger)} onClick={onCancelClicked}>
            {lang.tr('statusBar.cancelTraining')}
          </Button>
        )}
      </div>
    )
  }
}

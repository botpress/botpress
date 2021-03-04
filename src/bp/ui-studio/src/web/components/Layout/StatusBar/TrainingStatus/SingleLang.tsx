import { Button, Spinner } from '@blueprintjs/core'
import axios from 'axios'
import { NLU } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, useEffect, useState } from 'react'
import { AccessControl } from '~/components/Shared/Utils'

import style from './style.scss'

interface Props {
  dark?: boolean
  trainSession: NLU.TrainingSession
}

// TODO change this url for core ?
const BASE_NLU_URL = `${window.BOT_API_PATH}/mod/nlu`

const TrainingStatusComponent: FC<Props> = (props: Props) => {
  const { trainSession, dark } = props

  const { status, progress } = trainSession ?? {}
  const [loading, setLoading] = useState(false)

  const [message, setMessage] = useState('')

  const onTrainingNeeded = () => setMessage('')
  const onTraingDone = () => setMessage(lang.tr('statusBar.ready'))
  const onCanceling = () => setMessage(lang.tr('statusBar.canceling'))
  const onError = () => setMessage(lang.tr('statusBar.trainingError'))
  const onTrainingProgress = (progress: number) => {
    const p = Math.floor(progress * 100)
    setMessage(`${lang.tr('statusBar.training')} ${p}%`)
  }

  useEffect(() => {
    if (status === 'training') {
      onTrainingProgress(progress ?? 0)
    } else if (status === 'errored') {
      onError()
    } else if (status === 'canceled') {
      onCanceling()
    } else if (status === 'needs-training') {
      onTrainingNeeded()
    } else if (status === 'idle' || status === 'done') {
      onTraingDone()
    }
  }, [props.trainSession])

  const onTrainClicked = async (e: React.SyntheticEvent) => {
    setLoading(true)
    e.preventDefault()
    try {
      await axios.post(`${BASE_NLU_URL}/train/${trainSession.language}`)
    } catch (err) {
      onError()
    } finally {
      setLoading(false)
    }
  }

  const onCancelClicked = async (e: React.SyntheticEvent) => {
    setLoading(true)
    e.preventDefault()
    onCanceling()
    try {
      await axios.post(`${BASE_NLU_URL}/train/${trainSession.language}/delete`)
    } catch (err) {
      console.error('cannot cancel training')
    } finally {
      setLoading(false)
    }
  }

  if (!status) {
    return null
  } else {
    return (
      <div className={style.trainStatus}>
        <span
          className={cx(
            dark ? style.trainStatus_message_dark : style.trainStatus_message_light,
            style.trainStatus_message_spaced
          )}
        >
          {message}
        </span>

        {status === 'training-pending' && (
          <div className={style.trainStatus_pending}>
            <span className={cx(style.trainStatus_pending, style.text)}>{lang.tr('statusBar.trainingPending')}</span>
            <Spinner size={5} />
          </div>
        )}
        <AccessControl resource="bot.training" operation="write">
          {status === 'needs-training' && (
            <Button minimal className={style.button} onClick={onTrainClicked} disabled={loading}>
              {lang.tr('statusBar.trainChatbot')}
            </Button>
          )}
          {status === 'training' && (
            <Button minimal className={cx(style.button, style.danger)} onClick={onCancelClicked} disabled={loading}>
              {lang.tr('statusBar.cancelTraining')}
            </Button>
          )}
        </AccessControl>
      </div>
    )
  }
}
export default TrainingStatusComponent

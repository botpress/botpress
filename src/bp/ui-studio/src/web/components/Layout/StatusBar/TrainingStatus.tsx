import { Button, Spinner } from '@blueprintjs/core'
import axios from 'axios'
import { NLU } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'

import style from './style.scss'

interface Props {
  trainSession: NLU.TrainingSession
}

// TODO change this url for core ?
const BASE_NLU_URL = `${window.BOT_API_PATH}/mod/nlu`

const TrainingStatusComponent: FC<Props> = (props: Props) => {
  const { status, progress } = props.trainSession ?? {}
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
      await axios.post(`${BASE_NLU_URL}/train`)
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
      await axios.post(`${BASE_NLU_URL}/train/delete`)
    } catch (err) {
      console.error('cannot cancel training')
    } finally {
      setLoading(false)
    }
  }

  if (status === null) {
    return null
  } else {
    return (
      <div className={style.item}>
        <span className={style.message}>{message}</span>

        {status === 'needs-training' && (
          <Button minimal className={style.button} onClick={onTrainClicked} disabled={loading}>
            {lang.tr('statusBar.trainChatbot')}
          </Button>
        )}
        {status === 'training-pending' && (
          <div className={style.pending}>
            <span className={cx(style.pending, style.text)}>{lang.tr('statusBar.trainingPending')}</span>
            <Spinner size={5}/>
          </div>
        )}
        {status === 'training' && (
          <Button minimal className={cx(style.button, style.danger)} onClick={onCancelClicked} disabled={loading}>
            {lang.tr('statusBar.cancelTraining')}
          </Button>
        )}
      </div >
    )
  }
}

const mapStateToProps = (state: RootReducer) => ({
  trainSession: state.nlu.trainSession
})
export default connect(mapStateToProps)(TrainingStatusComponent)

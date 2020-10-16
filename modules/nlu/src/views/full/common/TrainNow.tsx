import { Button } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'

import { NLUApi } from '../../../api'
import { NLUProgressEvent } from '../../../backend/typings'

const TrainNow: FC<{ api: NLUApi; eventBus: any; autoTrain: boolean }> = ({ api, eventBus, autoTrain }) => {
  const [loading, setLoading] = useState(true)
  const [training, setTraining] = useState(false)

  useEffect(() => {
    const fetchIsTraining = async () => {
      setLoading(true)
      const isTraining = await api.isTraining()
      setTraining(isTraining)
      setLoading(false)
    }

    // tslint:disable-next-line: no-floating-promises
    fetchIsTraining()
  }, [])

  useEffect(() => {
    eventBus.on('statusbar.event', event => {
      if (event.type === 'nlu' && (event as NLUProgressEvent).trainSession.status === "done") {
        setTraining(false)
      }
    })
  }, [])

  const trainNow = async () => {
    setTraining(true)
    await api.train()
  }

  const cancelTraining = async () => {
    await api.cancelTraining()
    setTraining(false)
  }

  if (training) {
    return (
      <Button loading={loading} onClick={cancelTraining}>
        {lang.tr('module.nlu.cancelTraining')}
      </Button>
    )
  }

  return (
    <Button loading={loading} onClick={trainNow}>
      {lang.tr(autoTrain ? 'module.nlu.retrainAll' : 'module.nlu.trainNow')}
    </Button>
  )
}

export default TrainNow

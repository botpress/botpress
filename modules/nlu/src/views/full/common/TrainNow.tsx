import { Button } from '@blueprintjs/core'
import { NLUApi } from 'api'
import { lang } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'

const TrainNow: FC<{ api: NLUApi; eventBus: any }> = ({ api, eventBus }) => {
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
      if (event.type === 'nlu' && event.message === 'Training complete') {
        setTraining(false)
      }
    })
  }, [])

  const onClick = async () => {
    if (training) {
      await api.cancelTraining()
      setTraining(false)
    } else {
      setTraining(true)
      await api.train()
    }
  }

  return (
    <Button loading={loading} onClick={onClick}>
      {training ? lang.tr('module.nlu.cancelTraining') : lang.tr('module.nlu.trainNow')}
    </Button>
  )
}

export default TrainNow

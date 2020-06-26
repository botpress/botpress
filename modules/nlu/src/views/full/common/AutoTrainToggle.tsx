import { Switch } from '@blueprintjs/core'
import { NLUApi } from 'api'
import { lang } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'

import style from './style.scss'

type AutoTrainListener = (status: boolean) => void
export type AutoTrainObserver = {
  listeners: AutoTrainListener[]
}

const AutoTrainToggle: FC<{ api: NLUApi; observer: AutoTrainObserver }> = ({ api, observer }) => {
  const [autoTrain, setAutoTrain] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAutoTrain = async () => {
      setLoading(true)
      const isOn = await api.isAutoTrainOn()
      setAutoTrain(isOn)
      setLoading(false)
      notifyListeners(isOn)
    }

    // tslint:disable-next-line: no-floating-promises
    fetchAutoTrain()
  }, [])

  const notifyListeners = (autoTrainStatus: boolean) => {
    observer.listeners.forEach(l => l(autoTrainStatus))
  }

  const toggleAutoTrain = async () => {
    const newStatus = !autoTrain
    await api.setAutoTrain(newStatus)
    setAutoTrain(newStatus)
    notifyListeners(newStatus)
  }

  return (
    <Switch
      label={lang.tr('module.nlu.autoTrain')}
      checked={autoTrain}
      disabled={loading}
      className={style.autoTrainToggle}
      onClick={toggleAutoTrain}
    />
  )
}

export default AutoTrainToggle

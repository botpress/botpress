import { Switch } from '@blueprintjs/core'
import { NLUApi } from 'api'
import { lang } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'

import style from './style.scss'

const AutoTrainToggle: FC<{ api: NLUApi }> = ({ api }) => {
  const [autoTrain, setAutoTrain] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAutoTrain = async () => {
      setLoading(true)
      const isOn = await api.isAutoTrainOn()
      setAutoTrain(isOn)
      setLoading(false)
    }

    // tslint:disable-next-line: no-floating-promises
    fetchAutoTrain()
  }, [])

  const toggleAutoTrain = async () => {
    await api.setAutoTrain(!autoTrain)
    setAutoTrain(!autoTrain)
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

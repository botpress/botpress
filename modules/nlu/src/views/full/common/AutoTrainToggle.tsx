import { Switch } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { FC } from 'react'

import style from './style.scss'

interface Props {
  autoTrain: boolean
  loading: boolean
  toggleAutoTrain: () => void
}

const AutoTrainToggle: FC<Props> = (props: Props) => {

  const { autoTrain, loading, toggleAutoTrain } = props

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

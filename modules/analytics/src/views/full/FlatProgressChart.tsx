import React, { FC, Fragment } from 'react'

import style from './style.scss'

interface Props {
  color: string
  value: string
  name: string
}

const FlatProgressChart: FC<Props> = props => {
  const { color, value, name } = props

  return (
    <Fragment>
      <div className={style.progressMetric} style={{ width: value === 'N/A' ? 0 : value, background: color }}></div>
      <p className={style.progressMetricLabel}>{name}</p>
    </Fragment>
  )
}

export default FlatProgressChart

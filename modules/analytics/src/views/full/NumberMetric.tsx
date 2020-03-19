import { Icon } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC } from 'react'

import { Extras } from './index'
import style from './style.scss'

interface Props extends Extras {
  name: string
  value: number | string
}

const NumberMetric: FC<Props> = props => {
  const { value, name, className, icon, iconBottom } = props

  return (
    <div className={cx(style.genericMetric, className, { [style.wIcon]: icon || iconBottom })}>
      {icon && <Icon color="#5C7080" iconSize={20} icon={icon} />}
      <div>
        <p className={style.numberMetricValue}>{value}</p>
        <h3 className={style.metricName}>{name}</h3>
      </div>
      {iconBottom && <Icon color="#5C7080" iconSize={20} icon={iconBottom} />}
    </div>
  )
}

export default NumberMetric

import { Icon } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC } from 'react'

import { Extras } from './index'
import style from './style.scss'

interface Props extends Extras {
  name: string
  value: number | string
  diffFromPreviousRange?: number
}

const NumberMetric: FC<Props> = props => {
  const { value, name, className, icon, iconBottom, diffFromPreviousRange } = props
  let diffIcon

  if (diffFromPreviousRange) {
    if (diffFromPreviousRange > 0) {
      diffIcon = 'trending-up'
    } else if (diffFromPreviousRange < 0) {
      diffIcon = 'trending-down'
    }
  }

  return (
    <div className={cx(style.genericMetric, className, { [style.wIcon]: icon || iconBottom || diffIcon })}>
      {(icon || diffIcon) && (
        <div>
          <Icon color="#5C7080" iconSize={20} icon={icon || diffIcon} />
          {!!diffFromPreviousRange && (
            <span
              className={cx(style.diffNumber, {
                [style.diffNumberUp]: diffFromPreviousRange > 0,
                [style.diffNumberDown]: diffFromPreviousRange < 0
              })}
            >
              {diffFromPreviousRange > 0 && '+'}
              {diffFromPreviousRange}
            </span>
          )}
        </div>
      )}
      <div className={cx({ [style.alignBottom]: !iconBottom })}>
        <p className={style.numberMetricValue}>{value}</p>
        <h3 className={style.metricName}>{name}</h3>
      </div>
      <Icon color="#5C7080" iconSize={20} icon={iconBottom} />
    </div>
  )
}

export default NumberMetric

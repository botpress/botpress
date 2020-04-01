import { Icon, Position, Tooltip } from '@blueprintjs/core'
import { DateRange } from '@blueprintjs/datetime'
import cx from 'classnames'
import moment from 'moment'
import React, { FC } from 'react'

import { Extras } from './index'
import style from './style.scss'

interface Props extends Extras {
  name: string
  value: number | string
  diffFromPreviousRange?: number
  previousDateRange?: DateRange
}

const NumberMetric: FC<Props> = props => {
  const { value, name, className, icon, iconBottom, diffFromPreviousRange, previousDateRange } = props
  let diffIcon, startPreviousRange, endPreviousRange

  if (diffFromPreviousRange) {
    if (diffFromPreviousRange > 0) {
      diffIcon = 'trending-up'
    } else if (diffFromPreviousRange < 0) {
      diffIcon = 'trending-down'
    }

    startPreviousRange = moment(previousDateRange?.[0]).format('MMMM Do YYYY')
    endPreviousRange = moment(previousDateRange?.[1]).format('MMMM Do YYYY')
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
              <Tooltip content={`Compared to ${startPreviousRange} · ${endPreviousRange}`} position={Position.BOTTOM}>
                <span>
                  {diffFromPreviousRange > 0 && '+'}
                  {diffFromPreviousRange}
                </span>
              </Tooltip>
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

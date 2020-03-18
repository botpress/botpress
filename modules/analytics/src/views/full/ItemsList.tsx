import { Tooltip } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC } from 'react'

import style from './style.scss'

interface Props {
  name: string
  items: { label: string; href: string }[]
  className: string
  itemLimit: number
  hasTooltip?: boolean
}

const ItemsList: FC<Props> = props => {
  const { items, name, className, itemLimit, hasTooltip } = props

  return (
    <div className={className}>
      <h3 className={style.metricName}>{name}</h3>
      {!items.length && <p className={cx(style.emptyState, style.alignedLeft)}>No data available</p>}
      <ol>
        {items.slice(0, itemLimit).map((item, index) => (
          <li key={index}>
            {hasTooltip ? (
              <Tooltip content={item.label}>
                <a href={item.href}>{item.label}</a>
              </Tooltip>
            ) : (
              <a href={item.href}>{item.label}</a>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

export default ItemsList

import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC } from 'react'

import style from './style.scss'

interface Props {
  name: string
  unit?: string
  items: { label: string; count: number; onClick?: () => void }[]
  className: string
  itemLimit?: number
}

const ItemsList: FC<Props> = props => {
  const { name, className, itemLimit, unit } = props
  let { items } = props

  const formatValue = (value: number, unit?: string) => {
    if (unit && unit.length) {
      return `${value} ${unit}`
    }

    return `${value}`
  }

  if (itemLimit) {
    items = items.slice(0, itemLimit)
  }

  return (
    <div className={className}>
      <h3 className={style.metricName}>{name}</h3>
      {!items.length && (
        <p className={cx(style.emptyState, style.alignedLeft)}>{lang.tr('module.analytics.noDataAvailable')}</p>
      )}
      <ol>
        {items.map((item, index) => (
          <li key={index}>
            <a onClick={item.onClick} className={cx({ [style.disabled]: !item.onClick })}>
              <span>{item.label}</span>
              <span>({formatValue(item.count, unit)})</span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default ItemsList

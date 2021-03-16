import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC } from 'react'

import style from './style.scss'

interface Props {
  name: string
  items: { label: string; count: number; onClick?: () => void }[]
  className: string
  itemLimit?: number
}

const ItemsList: FC<Props> = props => {
  const { name, className, itemLimit } = props
  let { items } = props

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
              <span>({item.count})</span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default ItemsList

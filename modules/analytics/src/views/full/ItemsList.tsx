import { Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC } from 'react'

import style from './style.scss'

interface Props {
  name: string
  items: { label: string; onClick?: () => void }[]
  className: string
  itemLimit: number
  hasTooltip?: boolean
}

const ItemsList: FC<Props> = props => {
  const { items, name, className, itemLimit, hasTooltip } = props

  return (
    <div className={className}>
      <h3 className={style.metricName}>{name}</h3>
      {!items.length && (
        <p className={cx(style.emptyState, style.alignedLeft)}>{lang.tr('module.analytics.noDataAvailable')}</p>
      )}
      <ol>
        {items.slice(0, itemLimit).map((item, index) => (
          <li key={index}>
            {hasTooltip ? (
              <Tooltip content={item.label}>
                <a onClick={item.onClick}>{item.label}</a>
              </Tooltip>
            ) : (
              <a onClick={item.onClick}>{item.label}</a>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

export default ItemsList

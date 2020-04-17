import { Position, Tooltip } from '@blueprintjs/core'
import { ElementPreview } from 'botpress/utils'
import cx from 'classnames'
import React, { FC } from 'react'

import style from '../style.scss'

interface Props {
  elements: any
  isLite?: boolean
}

const Variations: FC<Props> = ({ elements, isLite }) => {
  if (!elements.length) {
    return null
  }

  return (
    <Tooltip
      position={Position.RIGHT}
      content={
        <ul className={cx(style.tooltip, { [style.lite]: isLite })}>
          {elements.map(variation => (
            <li key={variation}>
              {variation.startsWith('#!') ? <ElementPreview itemId={variation.replace('#!', '')} /> : variation}
            </li>
          ))}
        </ul>
      }
    >
      <span style={{ cursor: 'default' }}>
        &nbsp;
        <strong>({elements.length})</strong>
      </span>
    </Tooltip>
  )
}

export default Variations

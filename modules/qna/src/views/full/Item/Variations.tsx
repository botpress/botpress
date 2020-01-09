import { Position, Tooltip } from '@blueprintjs/core'
import { ElementPreview } from 'botpress/utils'
import React, { FC } from 'react'

import style from '../style.scss'

interface Props {
  elements: any
}

const Variations: FC<Props> = ({ elements }) => {
  if (!elements.length) {
    return null
  }

  return (
    <Tooltip
      position={Position.RIGHT}
      content={
        <ul className={style.tooltip}>
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

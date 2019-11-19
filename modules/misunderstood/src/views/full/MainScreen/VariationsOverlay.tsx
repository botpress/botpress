import { Popover, PopoverInteractionKind, PopoverPosition } from '@blueprintjs/core'
import { ElementPreview } from 'botpress/utils'
import React from 'react'

import style from './style.scss'

const VariationsOverlay = ({ elements }: { elements: string[] }) =>
  !!elements.length && (
    <Popover interactionKind={PopoverInteractionKind.HOVER} position={PopoverPosition.RIGHT}>
      <span>
        &nbsp;
        <strong>({elements.length})</strong>
      </span>
      <ul className={style.popover}>
        {elements.map(variation => (
          <li key={variation}>
            {variation.startsWith('#!') ? <ElementPreview itemId={variation.replace('#!', '')} /> : variation}
          </li>
        ))}
      </ul>
    </Popover>
  )

export default VariationsOverlay

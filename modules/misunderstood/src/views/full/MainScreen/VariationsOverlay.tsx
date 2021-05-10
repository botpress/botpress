import { Popover, PopoverInteractionKind, PopoverPosition } from '@blueprintjs/core'
import { AxiosStatic } from 'axios'
import { ModuleUI } from 'botpress/shared'
import React, { FC } from 'react'

import style from './style.scss'

interface Props {
  elements: string[]
  axios: AxiosStatic
  language: string
}

const { ElementPreview } = ModuleUI

const VariationsOverlay: FC<Props> = ({ elements, axios, language }) =>
  !!elements.length && (
    <Popover interactionKind={PopoverInteractionKind.HOVER} position={PopoverPosition.RIGHT}>
      <span>
        &nbsp;
        <strong>({elements.length})</strong>
      </span>
      <ul className={style.popover}>
        {elements.map(variation => (
          <li key={variation}>
            {variation.startsWith('#!') ? (
              <ElementPreview
                itemId={variation.replace('#!', '')}
                getAxiosClient={() => axios}
                contentLang={language}
              />
            ) : (
              variation
            )}
          </li>
        ))}
      </ul>
    </Popover>
  )

export default VariationsOverlay

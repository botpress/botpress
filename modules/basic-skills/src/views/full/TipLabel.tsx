import { Tooltip, Position, Icon } from '@blueprintjs/core'
import React from 'react'

import style from './style.scss'

interface Props {
  htmlFor: string
  labelText: string
  tooltipText: string
}

export const TipLabel = (props: Props) => (
  <label htmlFor={props.htmlFor} className={style.tipLabel}>
    <span>
      {props.labelText}&nbsp;
      <Tooltip className={style.skillToolTipPopover} content={props.tooltipText} position={Position.RIGHT} usePortal>
        <Icon icon="info-sign" iconSize={14} />
      </Tooltip>
    </span>
  </label>
)

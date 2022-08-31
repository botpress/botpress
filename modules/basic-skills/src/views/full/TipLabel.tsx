import { Label, Tooltip, Position, Icon } from '@blueprintjs/core'
import React from 'react'

import style from './style.scss'

interface Props {
  htmlFor: string
  labelText: string
  tooltipText: string
}

export const TipLabel = (props: Props) => (
  <Label htmlFor={props.htmlFor}>
    <span>
      {props.labelText}&nbsp;
      <Tooltip className={style.skillToolTipPopover} content={props.tooltipText} position={Position.TOP} usePortal>
        <Icon icon="info-sign" iconSize={14} />
      </Tooltip>
    </span>
  </Label>
)

import { Alignment, Button, Collapse, Icon, Position, Tooltip } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC, useState } from 'react'

import style from '../style.scss'

interface CollapsibleProps {
  name: string
  children: any
  opened?: boolean
  hidden?: boolean
}

export const Collapsible: FC<CollapsibleProps> = props => {
  const [isOpen, setOpen] = useState(props.opened)

  if (props.hidden) {
    return null
  }

  return (
    <div className={style.collapsibleContainer}>
      <Button
        icon={isOpen ? 'caret-down' : 'caret-right'}
        minimal={true}
        fill={true}
        alignText={Alignment.LEFT}
        text={props.name}
        onClick={() => setOpen(!isOpen)}
      />
      <Collapse isOpen={isOpen}>{props.children}</Collapse>
    </div>
  )
}

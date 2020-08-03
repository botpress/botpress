import { Alignment, Button, Collapse, Icon, Position, Tooltip } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import style from '../style.scss'

interface CollapsibleProps {
  name: string
  children: any
  opened?: boolean
  toggleExpand?: (expanded: boolean) => void
  hidden?: boolean
}

export const Collapsible: FC<CollapsibleProps> = props => {
  const [isOpen, setOpen] = useState(props.opened)

  useEffect(() => {
    setOpen(props.opened)
  }, [props.opened])

  if (props.hidden) {
    return null
  }

  const handleToggle = () => {
    const newValue = !isOpen
    setOpen(newValue)
    props.toggleExpand(newValue)
  }

  return (
    <div className={style.collapsibleContainer}>
      <Button
        icon={isOpen ? 'chevron-down' : 'chevron-right'}
        minimal={true}
        fill={true}
        alignText={Alignment.LEFT}
        text={props.name}
        onClick={handleToggle}
      />
      <Collapse isOpen={isOpen}>{props.children}</Collapse>
    </div>
  )
}

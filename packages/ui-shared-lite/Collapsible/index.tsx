// @ts-nocheck
import { Alignment, Button, Collapse } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import style from './style.scss'
import { CollapsibleProps } from './typings'

const Collapsible: FC<CollapsibleProps> = ({ opened, hidden, toggleExpand, name, children, ownProps }) => {
  const [isOpen, setOpen] = useState(opened)

  useEffect(() => {
    setOpen(opened)
  }, [opened])

  if (hidden) {
    return null
  }

  const handleToggle = () => {
    const newValue = !isOpen
    setOpen(newValue)
    toggleExpand && toggleExpand(newValue)
  }

  return (
    <div className={style.collapsibleContainer}>
      <Button
        className={style.collapseBtn}
        icon={isOpen ? 'chevron-down' : 'chevron-right'}
        minimal={true}
        fill={true}
        alignText={Alignment.LEFT}
        text={name}
        onClick={handleToggle}
      />
      <Collapse isOpen={isOpen} {...ownProps}>
        {children}
      </Collapse>
    </div>
  )
}

export default Collapsible

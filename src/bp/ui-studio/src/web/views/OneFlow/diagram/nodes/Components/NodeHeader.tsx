import { Button, Icon, Intent, Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, SyntheticEvent, useEffect, useState } from 'react'

import style from './style.scss'

interface Props {
  setExpanded?: (expanded: boolean) => void
  expanded?: boolean
  defaultLabel: string
  name: string
  type: string
  handleContextMenu: (e: SyntheticEvent) => void
  isEditing: boolean
  saveName: (value: string) => void
  error?: string
  children?: any
  className?: string
}

const NodeHeader: FC<Props> = ({
  setExpanded,
  expanded,
  defaultLabel,
  name,
  type,
  handleContextMenu,
  isEditing,
  saveName,
  error,
  children,
  className
}) => {
  const isDefaultName = name.startsWith(`${type}-`) || name.startsWith(`node-`)
  const getInitialInputValue = () => {
    return isDefaultName ? '' : name
  }

  const [inputValue, setInputValue] = useState(getInitialInputValue())

  useEffect(() => {
    setInputValue(getInitialInputValue())
  }, [name, isEditing])

  const onKeyDown = event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.target.select()
    }

    if (event.key === 'Escape' || event.key === 'Enter') {
      event.target.blur()
    }
  }

  const icon = expanded ? 'chevron-down' : 'chevron-right'

  return (
    <div className={cx(style.headerWrapper, className)}>
      {!isEditing ? (
        <Button
          icon={setExpanded ? icon : null}
          onClick={() => setExpanded?.(!expanded)}
          className={style.button}
          onContextMenu={handleContextMenu}
        >
          {isDefaultName ? defaultLabel : name}
        </Button>
      ) : (
        <div className={style.button}>
          {setExpanded && <Icon icon={icon} />}
          <input
            type="text"
            placeholder={lang.tr('studio.flow.node.renameBlock')}
            autoFocus
            onFocus={e => e.currentTarget.select()}
            onKeyDown={onKeyDown}
            onChange={e => setInputValue(e.currentTarget.value)}
            onBlur={() => saveName(inputValue)}
            value={inputValue}
            className={cx({ [style.error]: error })}
          />
          {error && (
            <span className={style.errorIcon}>
              <Tooltip content={error}>
                <Icon icon="warning-sign" iconSize={10} intent={Intent.DANGER} />
              </Tooltip>
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

export default NodeHeader

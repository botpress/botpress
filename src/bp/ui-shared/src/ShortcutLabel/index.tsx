import { Icon, IconName } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC } from 'react'

import { keyMap } from '../utils/keyboardShortcuts'

import style from './style.scss'
import { ShortcutLabelProps } from './typings'

const iconKeys = ['backspace', 'command', 'delete', 'enter', 'escape', 'option', 'shift', 'tab']

const ShortcutLabel: FC<ShortcutLabelProps> = props => {
  const { shortcut } = props
  let shortcutKeys, keys

  if (shortcut) {
    shortcutKeys = Array.isArray(keyMap[shortcut]) ? keyMap[shortcut].join('/') : keyMap[shortcut]
  }

  keys = props.keys || shortcutKeys?.split(/(\/|\s|\+)/).filter(item => !!item.trim() && item !== '+')

  return (
    <span className={cx(style.shortcut, { [style.light]: props.light })}>
      {keys.map((key, index) => {
        const icon = iconKeys.includes(key) && (`key-${key}` as IconName)

        return (
          <span className={cx({ [style.noLineHeight]: icon, [style.baseLineHeight]: !icon })} key={index}>
            {icon ? <Icon icon={icon} iconSize={12} /> : key.toUpperCase()}
          </span>
        )
      })}
    </span>
  )
}

export default ShortcutLabel

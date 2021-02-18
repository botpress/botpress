import cx from 'classnames'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import CommandPalette from 'react-command-palette'
import { generatePath } from 'react-router'

import { isOperationAllowed } from '../AccessControl'
import { lang } from '../translations'
import { controlKey } from '../utils/keyboardShortcuts'

import { getCommonShortcuts } from './shortcuts'
import style from './style.scss'
import bpTheme from './theme/bp-theme'
import './theme/custom.css'
import { Command, CommanderProps } from './typings'

const Commander: FC<CommanderProps> = props => {
  const [commands, setCommands] = useState<Command[]>([])

  useEffect(() => {
    if (!props.shortcuts) {
      return
    }

    const allowedShortcuts = [...props.shortcuts, ...getCommonShortcuts()].filter(
      x => !x.permission || (x.permission && isOperationAllowed({ ...x.permission, user: props.user }))
    )

    const getLabel = (label: string, shortcutType: string) => {
      if (shortcutType === 'goto') {
        return lang('commander.goTo', { destination: label })
      } else if (shortcutType === 'popup') {
        return lang('commander.inNewTab', { destination: label })
      }
      return label
    }

    const commands: Command[] = allowedShortcuts.map(shortcut => ({
      name: getLabel(shortcut.label, shortcut.type),
      category: shortcut.category,
      shortcut: shortcut.shortcut,
      command: () => {
        switch (shortcut.type) {
          case 'goto':
            const path = generatePath(shortcut.url, {
              workspaceId: window['WORKSPACE_ID'],
              botId: window['BOT_ID']
            })

            // Handle admin panel links when on studio or admin
            if (!shortcut.location || props.location === shortcut.location) {
              props.history.push(path)
            } else {
              window.location.href = `/admin${path}`
            }

            return
          case 'redirect':
            window.location.href = shortcut.url
            return
          case 'popup':
            window.open(shortcut.url)
            return
          case 'execute':
            if (_.isFunction(shortcut.method)) {
              shortcut.method()
            } else {
              console.error('Invalid argument')
            }
            return
        }
      }
    }))

    setCommands(_.orderBy(commands, x => x.name))
  }, [props.shortcuts])

  const options = {
    key: 'name',
    keys: ['name'],
    limit: 100,
    allowTypo: true
  }

  const commandRenderer = suggestion => {
    const { name, highlight, shortcut, category } = suggestion

    return (
      <div className={style.item}>
        <span className={style.categoryWrapper}>
          <span className={cx(style.category, style[category])}>{lang(`commander.category.${category}`)}</span>
        </span>

        {highlight ? <span dangerouslySetInnerHTML={{ __html: highlight }} /> : <span>{name}</span>}
        <kbd className={style.shortcut}>{shortcut}</kbd>
      </div>
    )
  }

  const renderHeader = () => {
    return (
      <div className={style.headerWrapper}>
        <span className={style.item}>{lang('commander.searchCommand')}</span>
        <span className={style.item}>
          <kbd className={style.kbd}>↑↓</kbd> {lang('commander.toNavigate')}
        </span>
        <span className={style.item}>
          <kbd className={style.kbd}>enter</kbd> {lang('commander.toSelect')}
        </span>
        <span className={style.item}>
          <kbd className={style.kbd}>esc</kbd> {lang('commander.toDismiss')}
        </span>
      </div>
    )
  }

  return (
    <CommandPalette
      hotKeys={`${controlKey}+shift+p`}
      maxDisplayed={100}
      commands={commands}
      trigger={<span />}
      placeholder={lang('commander.typeCommand')}
      resetInputOnClose
      closeOnSelect
      options={options}
      renderCommand={commandRenderer}
      header={renderHeader()}
      theme={bpTheme}
    />
  )
}

export { Commander }

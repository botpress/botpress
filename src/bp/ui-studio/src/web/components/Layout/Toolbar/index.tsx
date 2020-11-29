import { Icon, Tooltip } from '@blueprintjs/core'
import { lang, ShortcutLabel } from 'botpress/shared'
import classNames from 'classnames'
import React, { FC, Fragment } from 'react'
import { connect } from 'react-redux'
import { AccessControl } from '~/components/Shared/Utils'

import { RootReducer } from '../../../reducers'

import style from './style.scss'

interface OwnProps {
  isEmulatorOpen: boolean
  hasDoc: boolean
  toggleDocs: () => void
  toggleBottomPanel: () => void
  onToggleEmulator: () => void
}

type StateProps = ReturnType<typeof mapStateToProps>

type Props = StateProps & OwnProps

const Toolbar: FC<Props> = props => {
  const { toggleDocs, hasDoc, onToggleEmulator, isEmulatorOpen, toggleBottomPanel } = props

  return (
    <header className={style.toolbar}>
      <div className={style.list}>
        {!!hasDoc && (
          <Fragment>
            <Tooltip
              content={
                <div className={style.tooltip}>
                  {lang.tr('toolbar.help')}
                  <div className={style.shortcutLabel}>
                    <ShortcutLabel light shortcut="docs-toggle" />
                  </div>
                </div>
              }
            >
              <button className={style.item} onClick={toggleDocs}>
                <Icon color="#1a1e22" icon="help" iconSize={16} />
              </button>
            </Tooltip>
            <span className={style.divider}></span>
          </Fragment>
        )}
        <AccessControl resource="bot.logs" operation="read">
          <Tooltip
            content={
              <div className={style.tooltip}>
                {lang.tr('toolbar.bottomPanel')}
                <div className={style.shortcutLabel}>
                  <ShortcutLabel light shortcut="bottom-bar" />
                </div>
              </div>
            }
          >
            <button className={style.item} onClick={toggleBottomPanel}>
              <Icon color="#1a1e22" icon="console" iconSize={16} />
            </button>
          </Tooltip>
        </AccessControl>
        {window.IS_BOT_MOUNTED && (
          <Tooltip content={<ShortcutLabel light shortcut="emulator-focus" />}>
            <button
              className={classNames(style.item, style.itemSpacing, { [style.active]: isEmulatorOpen })}
              onClick={onToggleEmulator}
            >
              <Icon color="#1a1e22" icon="chat" iconSize={16} />
              <span className={style.label}>{lang.tr('toolbar.emulator')}</span>
            </button>
          </Tooltip>
        )}
      </div>
    </header>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  user: state.user,
  botInfo: state.bot,
  docHints: state.ui.docHints
})

export default connect(mapStateToProps)(Toolbar)

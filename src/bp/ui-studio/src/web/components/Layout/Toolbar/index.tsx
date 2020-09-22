import { Icon } from '@blueprintjs/core'
import { lang, ShortcutLabel, ToolTip } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, Fragment, useState } from 'react'
import { connect } from 'react-redux'

import { RootReducer } from '../../../reducers'

import style from './style.scss'
import ConfigForm from './ConfigForm'

interface OwnProps {
  isEmulatorOpen: boolean
  hasDoc: boolean
  toggleDocs: () => void
  toggleBottomPanel: () => void
  onToggleEmulator: () => void
}

type StateProps = ReturnType<typeof mapStateToProps>

type Props = StateProps & OwnProps

const Toolbar: FC<Props> = ({ toggleDocs, hasDoc, onToggleEmulator, isEmulatorOpen }) => {
  const [showConfigForm, setShowConfigForm] = useState(false)

  return (
    <Fragment>
      <header className={style.toolbar}>
        <div className={style.list}>
          {!!hasDoc && (
            <ToolTip
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
            </ToolTip>
          )}
          <ToolTip content={<div className={style.tooltip}>{lang.tr('toolbar.configuration')}</div>}>
            <button className={cx(style.item, style.itemSpacing)} onClick={() => setShowConfigForm(!showConfigForm)}>
              <Icon color="#1a1e22" icon="cog" iconSize={16} />
            </button>
          </ToolTip>
          <span className={style.divider}></span>
          {window.IS_BOT_MOUNTED && (
            <ToolTip content={<ShortcutLabel light shortcut="emulator-focus" />}>
              <button
                className={cx(style.item, style.itemSpacing, { [style.active]: isEmulatorOpen })}
                onClick={onToggleEmulator}
              >
                <Icon color="#1a1e22" icon="chat" iconSize={16} />
                <span className={style.label}>{lang.tr('toolbar.emulator')}</span>
              </button>
            </ToolTip>
          )}
        </div>
      </header>
      {showConfigForm && <ConfigForm close={() => setShowConfigForm(false)} />}
    </Fragment>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  user: state.user,
  botInfo: state.bot,
  docHints: state.ui.docHints
})

export default connect(mapStateToProps)(Toolbar)

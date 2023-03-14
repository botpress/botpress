import { Alignment, Button, Colors, Icon, Navbar, Tooltip } from '@blueprintjs/core'
import { lang, ShortcutLabel } from 'botpress/shared'
import cx from 'classnames'
import React, { FC } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import WorkspaceSelect from '~/app/WorkspaceSelect'

import AccessControl from '~/auth/AccessControl'
import UserDropdownMenu from '~/user/UserDropdownMenu'
import { AppState } from '../rootReducer'
import { toggleBottomPanel } from '../uiReducer'
import { HelpMenu } from './Help'
import style from './style.scss'

type Props = ConnectedProps<typeof connector>

const Header: FC<Props> = props => {
  return (
    <header className={cx('bp-header', style.header)}>
      <Navbar>
        <Navbar.Group>
          <Navbar.Heading>
            <div className={cx('bp-sa-title', style.title)}>
              <span>{props.pageTitle || ''}</span>
              {props.pageHelpText && (
                <Tooltip content={props.pageHelpText}>
                  <Icon icon="info-sign" color={Colors.LIGHT_GRAY1} />
                </Tooltip>
              )}
            </div>
          </Navbar.Heading>
        </Navbar.Group>
        <Navbar.Group align={Alignment.RIGHT}>
          <WorkspaceSelect />
          <Navbar.Divider />
          <HelpMenu />
          <Navbar.Divider />
          <AccessControl resource="admin.logs" operation="read">
            <Tooltip content={<div className={style.tooltip}>{lang.tr('bottomPanel.label')}</div>}>
              <Button onClick={props.toggleBottomPanel} minimal>
                <Icon color={Colors.BLACK} icon="console" iconSize={16} />
              </Button>
            </Tooltip>
          </AccessControl>

          <Navbar.Divider />
          <UserDropdownMenu />
        </Navbar.Group>
      </Navbar>
    </header>
  )
}

const mapStateToProps = (state: AppState) => ({
  pageTitle: state.ui.pageTitle,
  pageHelpText: state.ui.pageHelpText
})

const mapDispatchToProps = { toggleBottomPanel }
const connector = connect(mapStateToProps, mapDispatchToProps)

export default connector(Header)

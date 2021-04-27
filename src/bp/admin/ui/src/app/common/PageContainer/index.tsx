import { Alignment, Callout, Colors, Icon, Intent, Navbar, Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, Fragment } from 'react'
import WorkspaceSelect from '~/app/WorkspaceSelect'

import AccessControl from '~/auth/AccessControl'
import UserDropdownMenu from '~/user/UserDropdownMenu'
import style from './style.scss'

interface Props {
  title?: JSX.Element | string
  helpText?: JSX.Element | string
  contentClassName?: string
  fullWidth?: boolean
  superAdmin?: boolean
}

const PageContainer: FC<Props> = props => (
  <Fragment>
    <header className={cx('bp-header', style.header)}>
      <Navbar>
        <Navbar.Group>
          <Navbar.Heading>
            <div className={cx('bp-sa-title', style.title)}>
              <span>{props.title || ''}</span>
              {props.helpText && (
                <Tooltip content={props.helpText}>
                  <Icon icon={'info-sign'} color={Colors.LIGHT_GRAY1} />
                </Tooltip>
              )}
            </div>
          </Navbar.Heading>
        </Navbar.Group>
        <Navbar.Group align={Alignment.RIGHT}>
          <WorkspaceSelect />
          <Navbar.Divider />
          <UserDropdownMenu />
        </Navbar.Group>
      </Navbar>
    </header>
    <PageContent {...props} />
  </Fragment>
)

const PageContent: FC<Props> = props => {
  return (
    <Fragment>
      <div className={cx('bp-sa-overflow', style.overflow)}>
        <div
          className={cx('bp-sa-content', style.content, { [style.fullWidth]: props.fullWidth }, props.contentClassName)}
        >
          <AccessControl
            superAdmin={props.superAdmin}
            fallback={<Callout intent={Intent.DANGER}>{lang.tr('admin.pageRestrictedToAdmins')}</Callout>}
          >
            {props.children}
          </AccessControl>
        </div>
      </div>
    </Fragment>
  )
}

export default PageContainer

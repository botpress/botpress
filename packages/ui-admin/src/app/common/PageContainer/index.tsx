import { Callout, Intent } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, Fragment, useEffect } from 'react'
import { connect, ConnectedProps } from 'react-redux'

import AccessControl from '~/auth/AccessControl'
import { updatePageHeader } from '../../uiReducer'
import style from './style.scss'

type Props = ConnectedProps<typeof connector> & {
  title?: JSX.Element | string
  helpText?: JSX.Element | string
  contentClassName?: string
  fullWidth?: boolean
  superAdmin?: boolean
  children: React.ReactNode
  noWrapper?: boolean
}

const PageContainer: FC<Props> = props => {
  useEffect(() => {
    props.updatePageHeader(props.title, props.helpText)
  }, [props.title])

  const Child = (
    <AccessControl
      superAdmin={props.superAdmin}
      fallback={<Callout intent={Intent.DANGER}>{lang.tr('admin.pageRestrictedToAdmins')}</Callout>}
    >
      {props.children}
    </AccessControl>
  )
  return props.noWrapper ? (
    Child
  ) : (
    <Fragment>
      <div
        className={cx('bp-sa-content', style.content, { [style.fullWidth]: props.fullWidth }, props.contentClassName)}
      >
        {Child}
      </div>
    </Fragment>
  )
}

const mapDispatchToProps = { updatePageHeader }
const connector = connect(undefined, mapDispatchToProps)

export default connector(PageContainer)

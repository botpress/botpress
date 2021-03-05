import { Callout, Colors, Icon, Intent, Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, Fragment } from 'react'

import AccessControl from './AccessControl'

interface Props {
  title?: JSX.Element | string
  helpText?: JSX.Element | string
  contentClassName?: string
  fullWidth?: boolean
  superAdmin?: boolean
}

const PageContainer: FC<Props> = props => {
  return (
    <Fragment>
      <div className="bp-sa-title">
        <span>{props.title || ''}</span>
        {props.helpText && (
          <Tooltip content={props.helpText}>
            <Icon icon={'info-sign'} color={Colors.LIGHT_GRAY1} />
          </Tooltip>
        )}
      </div>
      <div className="bp-sa-overflow">
        <div className={cx('bp-sa-content', { 'bp-sa-fullwidth': props.fullWidth }, props.contentClassName)}>
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

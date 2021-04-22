import { Callout, Colors, Icon, Intent, Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, Fragment } from 'react'

import AccessControl from '~/auth/AccessControl'
import style from './style.scss'

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
      <div className={style.title}>
        <span>{props.title || ''}</span>
        {props.helpText && (
          <Tooltip content={props.helpText}>
            <Icon icon={'info-sign'} color={Colors.LIGHT_GRAY1} />
          </Tooltip>
        )}
      </div>
      <div className={style.overflow}>
        <div className={cx(style.content, { [style.fullWidth]: props.fullWidth }, props.contentClassName)}>
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

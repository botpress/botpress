import { Colors, Icon, Tooltip } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC, Fragment } from 'react'
interface Props {
  title?: JSX.Element | string
  helpText?: JSX.Element | string
  fullWidth?: boolean
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
        <div className={cx('bp-sa-content', { 'bp-sa-fullwidth': props.fullWidth })}>{props.children}</div>
      </div>
    </Fragment>
  )
}

export default PageContainer

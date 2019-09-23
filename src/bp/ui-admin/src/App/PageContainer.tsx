import { Colors, Icon, Tooltip } from '@blueprintjs/core'
import React, { FC, Fragment } from 'react'

interface Props {
  title?: string
  helpText?: string
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
        <div className="bp-sa-content">{props.children}</div>
      </div>
    </Fragment>
  )
}

export default PageContainer

import { Collapse, Icon, IconName, Intent, Position, Tag, Tooltip } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC, Fragment, useState } from 'react'

interface SourceInfo {
  type?: 'env' | 'config'
  key: string
  value: string
}

interface Props {
  title: string
  docs?: string
  source?: SourceInfo[]
  status: 'success' | 'warning' | 'danger' | 'none'
}

const Item: FC<Props> = props => {
  const [isOpen, setOpen] = useState(false)
  let icon: IconName = 'dot'
  if (props.status === 'success') {
    icon = 'small-tick'
  } else if (['warning', 'danger'].includes(props.status)) {
    icon = 'small-cross'
  }

  return (
    <div className="bp3-ui-text">
      <div onClick={() => setOpen(!isOpen)} className="checklist-header">
        <div>
          <Icon icon={icon} intent={props.status} />
          <span className="title">{props.title}</span>
        </div>
        <Icon icon={isOpen ? 'caret-up' : 'caret-down'} />
      </div>

      <Collapse isOpen={isOpen}>
        {props.docs && (
          <span className="checklist-docs">
            <Tooltip content="Click here to read more about this item in the documentation" position={Position.BOTTOM}>
              <a href={props.docs} target="_blank">
                <Icon icon="info-sign" />
              </a>
            </Tooltip>
          </span>
        )}

        <div className="checklist-item">
          {props.children}
          {props.source && (
            <div className="checklist-sources">
              <blockquote className="bp3-blockquote">
                {props.source.map(source => (
                  <div className="checklist-source" key={source.key}>
                    {source.type ? (
                      <Fragment>
                        <Tag intent={source.type === 'env' ? Intent.NONE : Intent.PRIMARY}>{source.key}</Tag>{' '}
                        <code>{source.value}</code>
                      </Fragment>
                    ) : (
                      <span>
                        {source.key}: <code>{source.value}</code>
                      </span>
                    )}
                  </div>
                ))}
              </blockquote>
            </div>
          )}
        </div>
      </Collapse>
    </div>
  )
}

export default Item

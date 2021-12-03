import { Tooltip } from '@blueprintjs/core'
import classNames from 'classnames'
import _ from 'lodash'
import React from 'react'

import style from './style.scss'

const titleToId = txt => txt.replace(/[^\W]/gi, '_')

export default props => (
  <Tooltip
    content={
      <div>
        <div>
          <strong>{props.title}</strong>
        </div>
        {props.shortcut && <div>{props.shortcut}</div>}
        {props.description}
      </div>
    }
  >
    <div
      className={classNames(style.item, props.className)}
      {..._.omit(props, ['title', 'description', 'children', 'className'])}
    >
      {props.children}
    </div>
  </Tooltip>
)

import cx from 'classnames'
import _ from 'lodash'
import React from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

import style from './style.scss'

const titleToId = txt => txt.replace(/[^\W]/gi, '_')

export default props => (
  <OverlayTrigger
    placement="bottom"
    delayShow={500}
    overlay={
      <Tooltip id={titleToId(props.title)}>
        <div>
          <strong>{props.title}</strong>
        </div>
        {props.shortcut && <div className={style.shortcut}>{props.shortcut}</div>}
        {props.description}
      </Tooltip>
    }
  >
    <li
      className={cx({ [style.clickable]: !props.disabled }, style.item, props.className)}
      {..._.omit(props, ['title', 'description', 'children', 'className'])}
    >
      {props.children}
    </li>
  </OverlayTrigger>
)

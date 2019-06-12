import React from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import _ from 'lodash'
import classNames from 'classnames'
import style from './StatusBar.styl'

const titleToId = txt => txt.replace(/[^\W]/gi, '_')

export default props => (
  <OverlayTrigger
    placement="top"
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
    <div
      className={classNames({ [style.clickable]: !props.disabled }, style.item, props.className)}
      {..._.omit(props, ['title', 'description', 'children', 'className'])}
    >
      {props.children}
    </div>
  </OverlayTrigger>
)

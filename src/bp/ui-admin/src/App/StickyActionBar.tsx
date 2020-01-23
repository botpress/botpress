import React, { FC } from 'react'

const StickyActionBar: FC = props => {
  return (
    <div className="sticky-action-bar">
      <div className="sticky-action-bar--content">{props.children}</div>
    </div>
  )
}

export default StickyActionBar

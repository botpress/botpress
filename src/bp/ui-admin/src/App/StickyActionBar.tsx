import React, { FC } from 'react'

interface Props {
}

const StickyActionBar: FC<Props> = props => {
  return (
    <div className="sticky-action-bar">
      <div className="sticky-action-bar--content">
        {props.children}
      </div>
    </div>
  )
}

export default StickyActionBar

import React, { FC } from 'react'

interface Props {
  children: React.ReactNode
  sideMenu?: React.ReactNode
  sideMenuWidth?: number
}

const SplitPage: FC<Props> = props => {
  return (
    <div className="split_page">
      <div className="split_page-container">{props.children}</div>

      {props.sideMenu && <div style={{ width: props.sideMenuWidth || 180 }}>{props.sideMenu}</div>}
    </div>
  )
}

export default SplitPage

import React, { FC } from 'react'

interface Props {
  children: React.ReactNode
  sideMenu?: React.ReactNode
  sideMenuWidth?: number
}

const SplitPage: FC<Props> = props => {
  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flexGrow: 1, padding: '0 25px' }}>{props.children}</div>

      {props.sideMenu && <div style={{ width: props.sideMenuWidth || 180 }}>{props.sideMenu}</div>}
    </div>
  )
}

export default SplitPage

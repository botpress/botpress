import React, { FC } from 'react'
import style from './style.scss'

interface Props {
  children: React.ReactNode
  sideMenu?: React.ReactNode
  sideMenuWidth?: number
}

const SplitPage: FC<Props> = props => {
  return (
    <div className={style.split_page}>
      <div className={style.container}>{props.children}</div>

      {props.sideMenu && <div style={{ width: props.sideMenuWidth || 180 }}>{props.sideMenu}</div>}
    </div>
  )
}

export default SplitPage

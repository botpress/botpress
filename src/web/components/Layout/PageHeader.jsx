import React from 'react'
import style from './PageHeader.scss'

export default (children) => {
  return <div className={style.header}>
    {children}
  </div>
}

import React from 'react'
import style from './PageHeader.scss'
import classnames from 'classnames'

export default (children) => {
  return <div className={classnames(style.header, 'bp-page-header')}>
    {children}
  </div>
}

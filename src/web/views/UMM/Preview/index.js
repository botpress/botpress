import React, { Component } from 'react'
import classnames from 'classnames'

const style = require('./style.scss')

const PreviewList = () => {
  const classNames = classnames(style.preview, 'bp-umm-preview')

  return <div className={classNames} />
}

export default PreviewList

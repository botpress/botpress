import React, { Component } from 'react'
import classnames from 'classnames'

import { FormGroup, FormControl } from 'react-bootstrap'

const style = require('./style.scss')

const ListView = () => {
  const classNames = classnames('bp-list', style.list)

  return <div className={classNames} />
}

export default ListView

import React, { Component } from 'react'
import classnames from 'classnames'

import { FormGroup, FormControl } from 'react-bootstrap'

const style = require('./style.scss')

const SearchView = () => {
  const classNames = classnames('bp-search', style.search)

  return (
    <div className={classNames}>
      <FormGroup>
        <FormControl id="searchTextInput" type="text" placeholder="Search" />
      </FormGroup>
    </div>
  )
}

export default SearchView

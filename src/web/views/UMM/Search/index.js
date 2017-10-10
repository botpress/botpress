import React, { Component } from 'react'
import classnames from 'classnames'

import {
  FormGroup,
  FormControl
} from 'react-bootstrap'

const style = require('./style.scss')

export default class SearchView extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    const classNames = classnames({
      'bp-search': true,
      [style.search]: true
    })

    return <div className={classNames}> 
      <FormGroup>
        <FormControl  
          id='searchTextInput'
          type='text'
          placeholder='Search' />
      </FormGroup>
    </div>
  }
}

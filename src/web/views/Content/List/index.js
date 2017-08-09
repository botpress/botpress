import React, { Component } from 'react'
import classnames from 'classnames'
import _ from 'lodash'
import { Button } from 'react-bootstrap'

const style = require('./style.scss')

export default class ListView extends Component {
  constructor(props) {
    super(props)
  }

  renderAddButton() {
    const classNames = classnames({
      'bp-button': true,
      [style.disabled]: this.props.selectedId === 'all'
    })

    return <Button 
        className={classNames} 
        onClick={() => this.props.handleAdd()}
        disabled={this.props.selectedId == 'all'}>
          Add
      </Button>
  }

  renderCategory(c) {
    const classNames = classnames({
      [style.selected]: c.id === this.props.selectedId
    })

    return <li className={classNames}>
        <a onClick={() => this.props.handleCategorySelected(c.id)}>
          <span className={style.title}>{c.title}</span>
          {c.count ? <span className={style.count}>{'(' + c.count + ')  '}</span> : null}
        </a>
      </li>
  }

  renderCategories() {
    const all = { 
      id: 'all',
      title: 'All',
      count: null
    }

    const categories = _.concat([all], (this.props.categories || []))

    return <ul>
        {categories.map(::this.renderCategory)}
      </ul>
  }

  render() {
    const classNames = classnames({
      'bp-list': true,
      [style.list]: true
    })

    return <div className={classNames}>
      {this.renderAddButton()}
      {this.renderCategories()}
    </div>
  }
}

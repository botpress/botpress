import React, { Component } from 'react'
import classnames from 'classnames'
import _ from 'lodash'
import { Button } from 'react-bootstrap'

const style = require('./style.scss')

const CATEGORY_ALL = {
  id: 'all',
  title: 'All',
  count: null
}

export default class SidebarView extends Component {
  renderAddButton() {
    if (this.props.readOnly) {
      return null
    }

    const classNames = classnames('bp-button', {
      [style.disabled]: this.props.selectedId === 'all'
    })

    return (
      <Button className={classNames} onClick={() => this.props.handleAdd()} disabled={this.props.selectedId == 'all'}>
        Add Content
      </Button>
    )
  }

  renderCategory = (c, i) => {
    const classNames = classnames({
      [style.selected]: c.id === this.props.selectedId
    })

    return (
      <li className={classNames} key={i}>
        <a onClick={() => this.props.handleCategorySelected(c.id)}>
          <span className={style.title}>{c.title}</span>
          {c.count ? <span className={style.count}>{'(' + c.count + ')  '}</span> : null}
        </a>
      </li>
    )
  }

  renderCategories() {
    const { categories } = this.props

    if (!categories || !categories.length) {
      return null
    }

    return <ul>{[CATEGORY_ALL].concat(categories).map(this.renderCategory)}</ul>
  }

  render() {
    const classNames = classnames('bp-sidebar', style.sidebar)

    return (
      <div className={classNames}>
        {this.renderAddButton()}
        {this.renderCategories()}
      </div>
    )
  }
}

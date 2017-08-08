import React, { Component } from 'react'
import classnames from 'classnames'
import _ from 'lodash'

const style = require('./style.scss')

export default class ListView extends Component {
  constructor(props) {
    super(props)
  }

  renderAddButton() {
    return <button className='bp-button' onClick={() => this.props.handleAdd()}>Add</button>
  }

  renderCategory(c) {
    return <li>
        <a onClick={() => this.props.handleCategorySelected(c.id)}>
          <span className={style.title}>{c.title}</span>
          {c.count ? <span className={style.count}>{c.count}</span> : null}
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

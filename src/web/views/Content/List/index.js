import React, { Component } from 'react'
import classnames from 'classnames'
import _ from 'lodash'

const style = require('./style.scss')

export default class ListView extends Component {
  constructor(props) {
    super(props)
  }

  renderAddButton() {
    return <button className='bp-button' onClick={() => this.props.handleAddItem()}>Add</button>
  }

  renderCategories() {
    const categories = _.concat(['All'], (this.props.categories || []))

    return <ul>
        {categories.map((name) => {
          return <li>
            <a onClick={() => this.props.handleCategorySelected(name)}>
              {name}
            </a>
          </li>
        })}
      </ul>
  }

  render() {
    const classNames = classnames({
      'bp-list': true,
      [style.list]: true
    })

    return <div className={classNames}>
      {this.renderCategories()}
    </div>
  }
}

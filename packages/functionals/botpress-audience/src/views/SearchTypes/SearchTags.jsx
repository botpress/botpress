import React from 'react'

import { FormControl, Col } from 'react-bootstrap'

import _ from 'lodash'

export default class SearchTags extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      tag_name: '',
      tag_value: ''
    }

    console.log('Test tag list:', this.props.tags)
    this.handleChange = this.handleChange.bind(this)
    this.searchTags = this.searchTags.bind(this)

    this.props.updateSearch({
      eval: this.searchTags,
      id: this.props.index
    })
  }

  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  searchTags(user) {
    if (this.state.tag_name === '') {
      return true
    }

    const tag = this.findTag(user.tags, this.state.tag_name)

    if (tag && (this.state.tag_value === '' || this.state.tag_value === tag.value)) {
      return true
    }

    return false
  }

  findTag(tags, target) {
    return (
      _.filter(tags, tag => {
        return tag.tag === target.toUpperCase()
      })[0] || null
    )
  }

  render() {
    return (
      <div>
        <Col sm={6}>
          <FormControl
            name="tag_name"
            // type='text'
            componentClass="select"
            placeholder="Tag name"
            value={this.state.tag_name}
            onChange={this.handleChange}
          >
            {this.props.tags.map(tag => {
              return <option key={tag}>{tag}</option>
            })}
          </FormControl>
        </Col>
        <Col sm={6}>
          <FormControl
            name="tag_value"
            type="text"
            placeholder="Tag value"
            value={this.state.tag_value}
            onChange={this.handleChange}
          />
        </Col>
      </div>
    )
  }
}

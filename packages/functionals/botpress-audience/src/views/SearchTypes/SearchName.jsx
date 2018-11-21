import React from 'react'

import { FormControl } from 'react-bootstrap'

export default class SearchName extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      name: props.name || ''
    }

    this.handleChange = this.handleChange.bind(this)
    this.searchNames = this.searchNames.bind(this)

    props.updateSearch({
      eval: this.searchNames,
      id: props.index
    })
  }

  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  searchNames(user) {
    console.log()

    if (!user || this.state.name === '') {
      return true
    }

    if (this.props.type === 'first') {
      return user.first_name && user.first_name.indexOf(this.state.name) >= 0
    } else {
      return user.last_name && user.last_name.indexOf(this.state.name) >= 0
    }
  }

  render() {
    return (
      <FormControl
        type="text"
        placeholder={`Search ${this.props.type} name...`}
        value={this.state.name}
        onChange={this.handleChange}
        name="name"
      />
    )
  }
}

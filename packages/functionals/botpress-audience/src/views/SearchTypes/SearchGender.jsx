import React from 'react'

import { FormControl } from 'react-bootstrap'

export default class SearchGender extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      genders: ['Male', 'Female', 'Other', 'Unknown', 'All'],
      selected: 'All'
    }

    this.handleChange = this.handleChange.bind(this)
    this.searchGender = this.searchGender.bind(this)

    props.updateSearch({
      eval: this.searchGender,
      id: props.index
    })
  }

  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  searchGender(user) {
    switch (this.state.selected) {
      case 'All':
        return true
      default:
        return this.state.selected.toLowerCase() === user.gender.toLowerCase()
    }
  }

  render() {
    return (
      <FormControl componentClass="select" value={this.state.selected} onChange={this.handleChange} name="selected">
        {this.state.genders.map(gender => {
          return <option key={gender}>{gender}</option>
        })}
      </FormControl>
    )
  }
}

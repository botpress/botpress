import React from 'react'

import { FormControl } from 'react-bootstrap'

export default class SearchPlatforms extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      selected: 'All',
      platforms: [...this.props.platforms, 'All']
    }

    this.handleChange = this.handleChange.bind(this)

    this.searchPlatforms = this.searchPlatforms.bind(this)

    this.props.updateSearch({
      eval: this.searchPlatforms,
      id: props.index
    })
  }

  handleChange(e) {
    this.setState({
      selected: e.target.value
    })
  }

  searchPlatforms(user) {
    if (this.state.selected === 'All') {
      return true
    } else {
      return user.platform === this.state.selected || user.channel === this.state.selected
    }
  }

  render() {
    return (
      <FormControl componentClass="select" value={this.state.selected} onChange={this.handleChange}>
        {this.state.platforms.map(item => {
          return <option key={item}>{item}</option>
        })}
      </FormControl>
    )
  }
}

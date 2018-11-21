import React from 'react'

import SearchEntry from './SearchEntry'
import { Button, ControlLabel, Form, Glyphicon } from 'react-bootstrap'

import _ from 'lodash'

export default class SearchPanel extends React.Component {
  constructor(props) {
    super(props)

    this.getTagList = this.getTagList.bind(this)
    this.updateSearch = this.updateSearch.bind(this)
    this.searchUsers = this.searchUsers.bind(this)
    this.addRow = this.addRow.bind(this)
    this.disableRow = this.disableRow.bind(this)

    this.state = {
      search: [
        {
          eval: true,
          id: 0
        }
      ],
      tags: this.getTagList(props.users)
    }
  }

  componentDidUpdate(props) {
    if (this.props.users !== props.users) {
      this.setState({
        tags: this.getTagList(props)
      })
    }
  }

  getAllUserTagNames(users) {
    return users.map(user => {
      if (user.tags) {
        return user.tags.map(tag => {
          return tag.tag
        })
      }
      return false
    })
  }

  getTagList(users) {
    if (!users) {
      return ['No tags found']
    }

    const tags = _.union(...this.getAllUserTagNames(users))

    if (tags.length === 0) {
      return ['No tags found']
    }

    return tags
  }

  renderSearchEntries() {
    return this.state.search.map((e, i) => {
      if (e.disabled) {
        return null
      }
      return (
        <SearchEntry
          key={e.id}
          index={i}
          updateSearch={this.updateSearch}
          updateRows={{
            addRow: this.addRow,
            disableRow: this.disableRow
          }}
          lastItem={e.id == this.state.search.length - 1}
          users={this.props.users}
          tags={this.state.tags}
        />
      )
    })
  }

  updateSearch(func) {
    const new_search = [...this.state.search]
    new_search[func.id] = func
    this.setState({
      search: new_search
    })
  }

  searchUsers(e) {
    e.preventDefault()

    if (!this.props.user) {
      this.props.updateUsers([])
    }

    const all_users = this.props.users

    const no_cond = this.state.search.length

    const valid_users = []

    all_users.forEach(user => {
      let passing = 0
      this.state.search.forEach(func => {
        passing += func.eval(user)
      })
      if (passing == no_cond) {
        valid_users.push(user)
      }
    })

    this.props.updateUsers(valid_users)
  }

  addRow() {
    const search = [...this.state.search]

    search.push({
      id: search.length + 1,
      eval: true
    })

    this.setState({
      search
    })
  }

  disableRow(index) {
    const search = [...this.state.search]

    search[index].disabled = true

    this.setState({
      search
    })
  }

  render() {
    return (
      <Form horizontal onSubmit={this.searchUsers}>
        <ControlLabel>Search Users</ControlLabel>

        {this.renderSearchEntries()}

        <Button type="submit" onSubmit={this.searchUsers}>
          Search
        </Button>
      </Form>
    )
  }
}

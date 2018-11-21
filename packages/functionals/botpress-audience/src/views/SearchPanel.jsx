import React from 'react'

import SearchEntry from './SearchEntry'
import { Button, ControlLabel, Form } from 'react-bootstrap'

import _ from 'lodash'

export default class SearchPanel extends React.Component {
  constructor(props) {
    super(props)

    this.getTagList = this.getTagList.bind(this)
    this.updateSearch = this.updateSearch.bind(this)
    this.searchUsers = this.searchUsers.bind(this)
    this.updateRows = this.updateRows.bind(this)

    this.state = {
      search: [
        {
          eval: true,
          id: 0
        }
      ],
      users: [],
      tags: this.getTagList(props.users)
    }
  }

  getTagList(users) {
    if (!users || !users.tags) {
      return ['No tags found']
    }
    const tags = [
      ...new Set(
        _.concat(
          ...users.map(user => {
            if (user.tags) {
              return user.tags.map(tag => {
                return tag.tag
              })
            }
            return false
          })
        )
      )
    ].sort()

    if (tags.length <= 0) {
      return ['No tags found']
    }

    return tags
  }

  renderSearchEntries() {
    return this.state.search.map((e, i) => {
      return (
        <SearchEntry
          key={e.id}
          index={i}
          updateSearch={this.updateSearch}
          updateRows={this.updateRows}
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

  updateRows(index, addRow = true) {
    const new_search = [...this.state.search]

    if (addRow) {
      new_search.push(true)
    } else {
      new_search.splice(index, 1)
    }

    this.setState({
      search: new_search
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

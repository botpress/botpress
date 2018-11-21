import React from 'react'

import { Col, Button, ButtonGroup, FormGroup, FormControl, Glyphicon } from 'react-bootstrap'

import SearchName from './SearchTypes/SearchName'
import SearchGender from './SearchTypes/SearchGender'
import SearchPlatforms from './SearchTypes/SearchPlatforms'
import SearchTags from './SearchTypes/SearchTags'

export default class SearchEntry extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      type: this.props.type || 'First Name',
      options: ['First Name', 'Last Name', 'Gender', 'Platforms', 'Tags'] //'Gender', 'Platform', 'Tags'
    }

    this.handleChange = this.handleChange.bind(this)
    this.renderSearch = this.renderSearch.bind(this)
    this.renderButtons = this.renderButtons.bind(this)

    this.addRow = this.addRow.bind(this)
    this.removeRow = this.removeRow.bind(this)
  }

  handleChange(e) {
    if (e.target) {
      this.setState({
        [e.target.name]: e.target.value
      })
    }
  }

  addRow() {
    this.props.updateRows.addRow()
  }

  removeRow() {
    this.props.updateRows.disableRow(this.props.index)
  }

  render() {
    return (
      <FormGroup controlId="formBasicText">
        <Col sm={4} md={2}>
          <FormControl
            componentClass="select"
            placeholder="select"
            value={this.state.type}
            onChange={this.handleChange}
            name="type"
          >
            {this.state.options.map(item => {
              return <option key={item}>{item}</option>
            })}
          </FormControl>
        </Col>
        <Col sm={5} md={8}>
          {this.renderSearch()}
        </Col>
        <Col sm={3} md={2}>
          {/* {this.props.lastItem ? this.renderButtons() : null} */}
          {this.renderButtons()}
        </Col>
      </FormGroup>
    )
  }

  renderButtons() {
    return (
      <ButtonGroup>
        <Button onClick={this.addRow} bsStyle="info">
          <Glyphicon glyph="plus" />
        </Button>
        {this.props.index != 0 ? (
          <Button onClick={this.removeRow} bsStyle="danger">
            <Glyphicon glyph="minus" />
          </Button>
        ) : null}
      </ButtonGroup>
    )
  }

  renderSearch() {
    switch (this.state.type) {
      case this.state.options[0]: //First Name
        return (
          <SearchName
            type="first"
            key={this.props.index}
            index={this.props.index}
            updateSearch={this.props.updateSearch}
          />
        )

      case this.state.options[1]: //Last Name
        return (
          <SearchName
            type="last"
            key={this.props.index}
            index={this.props.index}
            updateSearch={this.props.updateSearch}
          />
        )
      case this.state.options[2]: //Gender
        return <SearchGender key={this.props.index} index={this.props.index} updateSearch={this.props.updateSearch} />
      case this.state.options[3]: //Platforms
        return (
          <SearchPlatforms
            key={this.props.index}
            index={this.props.index}
            platforms={[
              ...new Set(
                this.props.users.map(item => {
                  return item.platform || item.channel
                })
              )
            ]}
            updateSearch={this.props.updateSearch}
          />
        )
      case this.state.options[4]: //Tags
        return <SearchTags index={this.props.index} tags={this.props.tags} updateSearch={this.props.updateSearch} />
      default:
        return null
    }
  }
}
